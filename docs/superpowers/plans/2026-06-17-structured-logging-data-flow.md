# Structured Logging for Data Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ad-hoc `print()` calls across the PNCP ETL classes and Kafka workers with a structured, JSON-Lines logging system that persists per-stage logs locally and correlates a full pipeline run via a `run_id`.

**Architecture:** A single stdlib-`logging`-based module (`app/infrastructure/logging_config.py`) exposes `get_logger(stage)` and `configure_logging(...)`. Each stage logger (`ppo.extract`, `ppo.transform`, `ppo.load`) writes JSON Lines to its own rotating file and propagates to an aggregated `pipeline.log` and a human-readable console. The orchestrator generates a `run_id` and propagates it to worker subprocesses via the `PPO_RUN_ID` env var.

**Tech Stack:** Python 3, stdlib `logging` (`RotatingFileHandler`), `pytest`. No new runtime dependencies.

## Global Constraints

- No new runtime dependencies — use the Python standard library only (`pytest` is the only new dev dependency).
- Log file format: **JSON Lines** (one JSON object per line) for files; **human-readable text** for console.
- File layout (under `LOG_DIR`, default `./logs`): `extract.log`, `transform.log`, `load.log`, `pipeline.log` — all `RotatingFileHandler` with `maxBytes=10485760` (10 MB), `backupCount=5`.
- Per-stage files are single-writer (safe). `pipeline.log` is aggregated best-effort across processes (documented limitation; do not add multiprocess-safe handlers).
- Logger namespace root: `ppo`. Stage names: `extract`, `transform`, `load`. Orchestrator: `orchestrator`.
- Correlation: every record carries `run_id`, resolved from env `PPO_RUN_ID` or generated once per process.
- Base JSON fields on every line: `ts` (ISO8601 UTC, ms precision, `Z` suffix), `level`, `component`, `run_id`, `event`, `message`. Errors add `error.{type,message,stack}`.
- Config via env (read in `config.py`): `LOG_DIR`, `LOG_LEVEL` (`INFO`), `LOG_MAX_BYTES`, `LOG_BACKUP_COUNT`, `LOG_TO_CONSOLE` (`true`).
- All work happens on branch `ft-logging-data-flow`. Run `pytest` from the `server/` directory.

---

## File Structure

- **Create** `server/app/infrastructure/logging_config.py` — the logging module (formatters, filter, `get_logger`, `configure_logging`, `resolve_run_id`, `reset_logging`).
- **Modify** `server/app/infrastructure/config.py` — add `LOG_*` config constants.
- **Modify** `server/app/etl/extract.py` — log `page_fetched` / errors.
- **Modify** `server/app/etl/load.py` — log SQLite/Mongo errors that are currently swallowed.
- **Modify** `server/app/workers/extract_worker.py` — structured publish/DLQ/stage events.
- **Modify** `server/app/workers/transform_worker.py` — structured consume/produce/DLQ events.
- **Modify** `server/app/workers/load_worker.py` — structured `batch_persisted`/stage events.
- **Modify** `server/app/orchestrate_prefect.py` — generate + propagate `run_id`, call `configure_logging`.
- **Create** `server/tests/` (`__init__.py`, `conftest.py`, `test_config.py`, `test_logging_config.py`, `test_etl_logging.py`, `test_worker_logging.py`, `test_orchestrator_logging.py`).
- **Create** `server/pytest.ini` — pytest config (pythonpath, testpaths).
- **Modify** `server/requirements.txt` — add `pytest`.
- **Modify** `server/.gitignore` — ignore `logs/`.
- **Modify** `server/README.md` — short "Logs" section.

---

## Task 1: Project setup — logging config, test harness, ignore rules

**Files:**
- Modify: `server/app/infrastructure/config.py`
- Modify: `server/requirements.txt`
- Modify: `server/.gitignore`
- Create: `server/pytest.ini`
- Create: `server/tests/__init__.py`
- Test: `server/tests/test_config.py`

**Interfaces:**
- Consumes: nothing.
- Produces: `LOG_DIR: str`, `LOG_LEVEL: str`, `LOG_MAX_BYTES: int`, `LOG_BACKUP_COUNT: int`, `LOG_TO_CONSOLE: bool` in `app.infrastructure.config`.

- [ ] **Step 1: Add logging config constants to `config.py`**

Append to the end of `server/app/infrastructure/config.py`:

```python

# ============================================================================
# Logging Configuration
# ============================================================================

LOG_DIR = os.getenv("LOG_DIR", "./logs")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_MAX_BYTES = int(os.getenv("LOG_MAX_BYTES", str(10 * 1024 * 1024)))
LOG_BACKUP_COUNT = int(os.getenv("LOG_BACKUP_COUNT", "5"))
LOG_TO_CONSOLE = os.getenv("LOG_TO_CONSOLE", "true").lower() in ("1", "true", "yes")
```

- [ ] **Step 2: Add `pytest` to `requirements.txt`**

Append a line to `server/requirements.txt`:

```
pytest>=7.0.0
```

- [ ] **Step 3: Ignore the `logs/` directory**

Append to `server/.gitignore` (the existing `*.log` rule does not cover rotated backups like `extract.log.1`):

```
# Local pipeline logs
logs/
```

- [ ] **Step 4: Create `server/pytest.ini`**

```ini
[pytest]
pythonpath = .
testpaths = tests
```

- [ ] **Step 5: Create `server/tests/__init__.py`** (empty file)

```python
```

- [ ] **Step 6: Write the failing test for config defaults**

Create `server/tests/test_config.py`:

```python
from app.infrastructure import config


def test_logging_config_defaults():
    assert config.LOG_DIR
    assert config.LOG_LEVEL == "INFO"
    assert config.LOG_MAX_BYTES == 10 * 1024 * 1024
    assert config.LOG_BACKUP_COUNT == 5
    assert config.LOG_TO_CONSOLE is True
```

- [ ] **Step 7: Run the test**

Run (from `server/`): `pytest tests/test_config.py -v`
Expected: PASS (config constants exist with the documented defaults).

- [ ] **Step 8: Commit**

```bash
git add server/app/infrastructure/config.py server/requirements.txt server/.gitignore server/pytest.ini server/tests/__init__.py server/tests/test_config.py
git commit -m "chore: add logging config constants and pytest harness

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: The logging module (`logging_config.py`)

**Files:**
- Create: `server/app/infrastructure/logging_config.py`
- Create: `server/tests/conftest.py`
- Test: `server/tests/test_logging_config.py`

**Interfaces:**
- Consumes: `LOG_DIR`, `LOG_LEVEL`, `LOG_MAX_BYTES`, `LOG_BACKUP_COUNT`, `LOG_TO_CONSOLE` from `app.infrastructure.config`.
- Produces:
  - `get_logger(name: str) -> logging.Logger` — returns `logging.getLogger(f"ppo.{name}")`.
  - `configure_logging(component: Optional[str] = None, log_dir: Optional[str] = None, level: Optional[str] = None, to_console: Optional[bool] = None) -> None` — idempotent handler setup.
  - `resolve_run_id() -> str` — env `PPO_RUN_ID` or a freshly generated id.
  - `reset_logging() -> None` — tears down handlers (test helper).
  - `RunIdFilter`, `JsonLinesFormatter`, `HumanFormatter` classes.
  - Module constants: `ROOT_LOGGER_NAME = "ppo"`, `STAGES = ("extract", "transform", "load")`.

- [ ] **Step 1: Write the failing tests**

Create `server/tests/conftest.py`:

```python
import pytest

from app.infrastructure.logging_config import reset_logging


@pytest.fixture(autouse=True)
def _reset_logging():
    reset_logging()
    yield
    reset_logging()
```

Create `server/tests/test_logging_config.py`:

```python
import json
import logging

from app.infrastructure import logging_config as lc


def _make_record(name="ppo.extract", msg="hello", level=logging.INFO, **extra):
    record = logging.LogRecord(name, level, __file__, 10, msg, None, None)
    for key, value in extra.items():
        setattr(record, key, value)
    return record


def test_json_formatter_produces_valid_json():
    formatter = lc.JsonLinesFormatter()
    record = _make_record(event="stage_start", run_id="run-1", topic="raw.licitacoes")
    payload = json.loads(formatter.format(record))

    assert payload["level"] == "INFO"
    assert payload["component"] == "extract"
    assert payload["event"] == "stage_start"
    assert payload["run_id"] == "run-1"
    assert payload["topic"] == "raw.licitacoes"
    assert payload["message"] == "hello"
    assert payload["ts"].endswith("Z")


def test_json_formatter_serializes_exception():
    formatter = lc.JsonLinesFormatter()
    try:
        raise ValueError("boom")
    except ValueError:
        import sys
        record = logging.LogRecord(
            "ppo.load", logging.ERROR, __file__, 10, "falhou", None, sys.exc_info()
        )
    payload = json.loads(formatter.format(record))

    assert payload["error"]["type"] == "ValueError"
    assert payload["error"]["message"] == "boom"
    assert "ValueError" in payload["error"]["stack"]


def test_resolve_run_id_uses_env(monkeypatch):
    monkeypatch.setenv("PPO_RUN_ID", "fixed-run")
    assert lc.resolve_run_id() == "fixed-run"


def test_run_id_filter_injects_when_absent():
    log_filter = lc.RunIdFilter("abc")
    record = _make_record()
    assert log_filter.filter(record) is True
    assert record.run_id == "abc"


def test_configure_logging_is_idempotent(tmp_path):
    lc.configure_logging(log_dir=str(tmp_path), to_console=False)
    root = logging.getLogger(lc.ROOT_LOGGER_NAME)
    count = len(root.handlers)
    lc.configure_logging(log_dir=str(tmp_path), to_console=False)
    assert len(root.handlers) == count


def test_stage_log_routes_to_stage_and_pipeline_files(tmp_path):
    lc.configure_logging(component="extract", log_dir=str(tmp_path), to_console=False)
    logger = lc.get_logger("extract")
    logger.info("publicado", extra={"event": "record_published", "count": 10})

    extract_lines = (tmp_path / "extract.log").read_text().splitlines()
    pipeline_lines = (tmp_path / "pipeline.log").read_text().splitlines()
    assert extract_lines and pipeline_lines

    record = json.loads(extract_lines[0])
    assert record["component"] == "extract"
    assert record["event"] == "record_published"
    assert record["count"] == 10
    assert "publicado" in pipeline_lines[0]
```

- [ ] **Step 2: Run the tests to verify they fail**

Run (from `server/`): `pytest tests/test_logging_config.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.infrastructure.logging_config'` (and `conftest.py` import error).

- [ ] **Step 3: Implement the module**

Create `server/app/infrastructure/logging_config.py`:

```python
"""Structured JSON-Lines logging for the PNCP data pipeline.

Each pipeline stage (extract/transform/load) logs to its own rotating JSON
file and propagates to an aggregated pipeline.log plus a human-readable
console. A correlation run_id ties all stages of one run together; the
orchestrator sets PPO_RUN_ID and worker subprocesses inherit it.
"""
import json
import logging
import logging.handlers
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from uuid import uuid4

from app.infrastructure.config import (
    LOG_BACKUP_COUNT,
    LOG_DIR,
    LOG_LEVEL,
    LOG_MAX_BYTES,
    LOG_TO_CONSOLE,
)

ROOT_LOGGER_NAME = "ppo"
STAGES = ("extract", "transform", "load")

# Standard LogRecord attributes. Anything else set on a record is treated as a
# structured "extra" field and serialized into the JSON line.
_RESERVED = {
    "name", "msg", "args", "levelname", "levelno", "pathname", "filename",
    "module", "exc_info", "exc_text", "stack_info", "lineno", "funcName",
    "created", "msecs", "relativeCreated", "thread", "threadName",
    "processName", "process", "taskName", "message", "asctime",
    "run_id", "event",
}

_CONFIGURED = False


def _generate_run_id() -> str:
    return f"{datetime.now(timezone.utc):%Y%m%dT%H%M%S}-{uuid4().hex[:6]}"


def resolve_run_id() -> str:
    """Return PPO_RUN_ID from the environment, or generate a fresh id."""
    return os.environ.get("PPO_RUN_ID") or _generate_run_id()


def get_logger(name: str) -> logging.Logger:
    """Return the stage/component logger, e.g. get_logger('extract')."""
    return logging.getLogger(f"{ROOT_LOGGER_NAME}.{name}")


class RunIdFilter(logging.Filter):
    """Injects run_id into every record that does not already carry one."""

    def __init__(self, run_id: Optional[str] = None):
        super().__init__()
        self.run_id = run_id or resolve_run_id()

    def filter(self, record: logging.LogRecord) -> bool:
        if not getattr(record, "run_id", None):
            record.run_id = self.run_id
        return True


class JsonLinesFormatter(logging.Formatter):
    """Serializes a LogRecord to a single-line JSON object."""

    def format(self, record: logging.LogRecord) -> str:
        ts = datetime.fromtimestamp(record.created, tz=timezone.utc)
        payload = {
            "ts": ts.strftime("%Y-%m-%dT%H:%M:%S.") + f"{int(record.msecs):03d}Z",
            "level": record.levelname,
            "component": record.name.removeprefix(ROOT_LOGGER_NAME + "."),
            "run_id": getattr(record, "run_id", None),
            "event": getattr(record, "event", None),
            "message": record.getMessage(),
        }

        for key, value in record.__dict__.items():
            if key not in _RESERVED and key not in payload:
                payload[key] = value

        if record.exc_info:
            exc_type, exc_value, _ = record.exc_info
            payload["error"] = {
                "type": exc_type.__name__ if exc_type else None,
                "message": str(exc_value) if exc_value else None,
                "stack": self.formatException(record.exc_info),
            }

        return json.dumps(payload, ensure_ascii=False, default=str)


class HumanFormatter(logging.Formatter):
    """Readable console line that appends the event code when present."""

    def format(self, record: logging.LogRecord) -> str:
        base = super().format(record)
        event = getattr(record, "event", None)
        return f"{base}  [{event}]" if event else base


def _build_file_handler(path: Path) -> logging.Handler:
    handler = logging.handlers.RotatingFileHandler(
        path,
        maxBytes=LOG_MAX_BYTES,
        backupCount=LOG_BACKUP_COUNT,
        encoding="utf-8",
        delay=True,
    )
    handler.setFormatter(JsonLinesFormatter())
    return handler


def configure_logging(
    component: Optional[str] = None,
    log_dir: Optional[str] = None,
    level: Optional[str] = None,
    to_console: Optional[bool] = None,
) -> None:
    """Configure the ppo logging tree once per process (idempotent).

    component=None configures all stage files (orchestrator / batch mode);
    component="extract" configures only that stage's file (a single worker).
    """
    global _CONFIGURED
    if _CONFIGURED:
        return

    directory = Path(log_dir or LOG_DIR)
    directory.mkdir(parents=True, exist_ok=True)
    level = level or LOG_LEVEL
    to_console = LOG_TO_CONSOLE if to_console is None else to_console
    run_id_filter = RunIdFilter()

    root = logging.getLogger(ROOT_LOGGER_NAME)
    root.setLevel(level)
    root.propagate = False

    pipeline_handler = _build_file_handler(directory / "pipeline.log")
    pipeline_handler.addFilter(run_id_filter)
    root.addHandler(pipeline_handler)

    if to_console:
        console = logging.StreamHandler()
        console.setFormatter(
            HumanFormatter("%(asctime)s %(levelname)-7s %(name)s | %(message)s")
        )
        console.addFilter(run_id_filter)
        root.addHandler(console)

    stages = STAGES if component is None else (component,)
    for stage in stages:
        if stage not in STAGES:
            continue
        stage_logger = logging.getLogger(f"{ROOT_LOGGER_NAME}.{stage}")
        stage_logger.setLevel(level)
        stage_handler = _build_file_handler(directory / f"{stage}.log")
        stage_handler.addFilter(run_id_filter)
        stage_logger.addHandler(stage_handler)
        # propagate=True (default) -> records also reach pipeline.log + console

    _CONFIGURED = True


def reset_logging() -> None:
    """Remove all ppo handlers and reset the configured flag (tests only)."""
    global _CONFIGURED
    for name in (ROOT_LOGGER_NAME, *(f"{ROOT_LOGGER_NAME}.{s}" for s in STAGES)):
        logger = logging.getLogger(name)
        for handler in list(logger.handlers):
            handler.close()
            logger.removeHandler(handler)
    _CONFIGURED = False
```

- [ ] **Step 4: Run the tests to verify they pass**

Run (from `server/`): `pytest tests/test_logging_config.py -v`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add server/app/infrastructure/logging_config.py server/tests/conftest.py server/tests/test_logging_config.py
git commit -m "feat: add structured JSON-Lines logging module

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Wire the extract stage

**Files:**
- Modify: `server/app/etl/extract.py`
- Modify: `server/app/workers/extract_worker.py`
- Test: `server/tests/test_etl_logging.py`, `server/tests/test_worker_logging.py`

**Interfaces:**
- Consumes: `get_logger`, `configure_logging` from `app.infrastructure.logging_config`.
- Produces: module-level `logger = get_logger("extract")` in both files; `delivery_report(err, msg)` logs `delivery_failed`/`delivered`.

- [ ] **Step 1: Write the failing tests**

Create `server/tests/test_etl_logging.py`:

```python
import logging

import pytest

from app.etl.extract import Extract


def test_extract_paginated_logs_page_fetched(monkeypatch, caplog):
    extractor = Extract()
    pages = [{"data": [{"numeroControlePNCP": "PNCP-1"}]}, {"data": []}]

    def fake_extract(params):
        return pages.pop(0)

    monkeypatch.setattr(extractor, "extract_procurements", fake_extract)

    with caplog.at_level(logging.DEBUG, logger="ppo.extract"):
        records = list(extractor.extract_paginated({"pagina": "1"}, max_pages=2))

    assert len(records) == 1
    events = [getattr(r, "event", None) for r in caplog.records]
    assert "page_fetched" in events
```

Create `server/tests/test_worker_logging.py`:

```python
import logging

from app.workers import extract_worker


class _FakeMsg:
    def topic(self):
        return "raw.licitacoes"

    def partition(self):
        return 0

    def offset(self):
        return 7


def test_extract_delivery_report_logs_failure(caplog):
    with caplog.at_level(logging.ERROR, logger="ppo.extract"):
        extract_worker.delivery_report("broker down", _FakeMsg())

    events = [getattr(r, "event", None) for r in caplog.records]
    assert "delivery_failed" in events
```

- [ ] **Step 2: Run the tests to verify they fail**

Run (from `server/`): `pytest tests/test_etl_logging.py tests/test_worker_logging.py -v`
Expected: FAIL (no `page_fetched`/`delivery_failed` events emitted yet).

- [ ] **Step 3: Update `extract.py`**

Replace the full contents of `server/app/etl/extract.py` with:

```python
import time
from typing import Any, Dict, Generator

import requests

from app.infrastructure.exceptions import NonRetryableAPIError
from app.infrastructure.logging_config import get_logger
from app.infrastructure.settings import PNCP_BASE_URL

logger = get_logger("extract")


class Extract():
    def __init__(self, timeout: int = 30, max_retries: int = 3):
        self.timeout = timeout
        self.max_retries = max_retries

    def extract_procurements(self, params: dict) -> Dict[str, Any]:
        """Extract single page from PNCP API."""
        try:
            response = requests.get(
                PNCP_BASE_URL,
                params=params,
                timeout=self.timeout,
            )

            if response.status_code == 422:
                raise NonRetryableAPIError(f"Erro 422 - parâmetros inválidos: {response.text}")

            response.raise_for_status()
            return response.json()

        except requests.exceptions.ReadTimeout as err:
            raise err
        except requests.exceptions.HTTPError as err:
            raise err

    def extract_paginated(self, params: dict, max_pages: int = None) -> Generator[Dict[str, Any], None, None]:
        """
        Extract procurements with pagination support.
        Yields individual records from each page.
        """
        current_page = int(params.get('pagina', 1))
        pages_fetched = 0

        while True:
            if max_pages and pages_fetched >= max_pages:
                break

            params['pagina'] = str(current_page)

            try:
                response_data = self.extract_procurements(params)
                data = response_data.get('data', [])

                if not data:
                    break

                logger.debug(
                    "Página obtida da API PNCP",
                    extra={"event": "page_fetched", "page": current_page, "record_count": len(data)},
                )

                for record in data:
                    yield {
                        'extracted_at': params.get('extracted_at'),
                        'pagina': current_page,
                        'payload': record,
                    }

                pages_fetched += 1
                current_page += 1
                time.sleep(0.5)

            except NonRetryableAPIError:
                logger.warning(
                    "Extração interrompida por erro non-retryable",
                    extra={"event": "extract_stopped", "page": current_page},
                    exc_info=True,
                )
                break
            except Exception:
                logger.error(
                    "Erro ao extrair página",
                    extra={"event": "error", "page": current_page},
                    exc_info=True,
                )
                break
```

- [ ] **Step 4: Update `extract_worker.py`**

Replace the full contents of `server/app/workers/extract_worker.py` with:

```python
"""Extract Worker - Kafka Producer for PNCP data extraction."""
import argparse
import json
import time
from datetime import datetime

from confluent_kafka import Producer

from app.etl.extract import Extract
from app.infrastructure.config import KAFKA_TOPICS, PRODUCER_CONFIG, RECIFE_PROCUREMENT
from app.infrastructure.logging_config import configure_logging, get_logger

logger = get_logger("extract")


def delivery_report(err, msg):
    """Delivery report callback."""
    if err is not None:
        logger.error(
            "Falha na entrega da mensagem ao Kafka",
            extra={
                "event": "delivery_failed",
                "topic": msg.topic() if msg is not None else None,
                "error": str(err),
            },
        )
    else:
        logger.debug(
            "Mensagem entregue ao Kafka",
            extra={
                "event": "delivered",
                "topic": msg.topic(),
                "partition": msg.partition(),
                "offset": msg.offset(),
            },
        )


class ExtractWorker:
    def __init__(self):
        self.producer = Producer(PRODUCER_CONFIG)
        self.extractor = Extract()

    def run(self, params: dict, max_pages: int = None):
        """Extract data from PNCP API and publish to Kafka."""
        params['extracted_at'] = datetime.utcnow().isoformat() + 'Z'
        started = time.monotonic()

        logger.info(
            "Extração iniciada",
            extra={"event": "stage_start", "topic": KAFKA_TOPICS['raw_licitacoes'], "max_pages": max_pages},
        )

        try:
            record_count = 0
            error_count = 0

            for record in self.extractor.extract_paginated(params, max_pages):
                try:
                    message = json.dumps(record, ensure_ascii=False, default=str)
                    key = record['payload'].get('numeroControlePNCP', '')

                    self.producer.produce(
                        topic=KAFKA_TOPICS['raw_licitacoes'],
                        value=message.encode('utf-8'),
                        key=key.encode('utf-8'),
                        callback=delivery_report,
                    )

                    record_count += 1
                    logger.debug(
                        "Registro publicado",
                        extra={"event": "record_published", "topic": KAFKA_TOPICS['raw_licitacoes'], "key": key},
                    )

                    if record_count % 10 == 0:
                        self.producer.flush(timeout=5)
                        logger.info(
                            "Progresso de publicação",
                            extra={"event": "publish_progress", "count": record_count},
                        )

                except Exception as exc:
                    error_record = {
                        'error': str(exc),
                        'original_record': record,
                        'timestamp': datetime.utcnow().isoformat() + 'Z',
                    }
                    error_message = json.dumps(error_record, ensure_ascii=False, default=str)

                    self.producer.produce(
                        topic=KAFKA_TOPICS['raw_licitacoes_dlq'],
                        value=error_message.encode('utf-8'),
                        callback=delivery_report,
                    )

                    error_count += 1
                    logger.warning(
                        "Registro enviado para a DLQ",
                        extra={"event": "dlq_sent", "dlq_topic": KAFKA_TOPICS['raw_licitacoes_dlq'], "reason": str(exc)},
                    )

            self.producer.flush(timeout=10)
            logger.info(
                "Extração concluída",
                extra={
                    "event": "stage_end",
                    "count": record_count,
                    "error_count": error_count,
                    "duration_ms": round((time.monotonic() - started) * 1000),
                },
            )

        except Exception:
            logger.error("Erro durante a extração", extra={"event": "error"}, exc_info=True)
            raise


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Extract data from PNCP API')
    parser.add_argument('--dataInicial', type=str, default=RECIFE_PROCUREMENT['dataInicial'],
                        help=f"Data inicial (padrão: {RECIFE_PROCUREMENT['dataInicial']})")
    parser.add_argument('--dataFinal', type=str, default=RECIFE_PROCUREMENT['dataFinal'],
                        help=f"Data final (padrão: {RECIFE_PROCUREMENT['dataFinal']})")
    parser.add_argument('--codigoModalidadeContratacao', type=str,
                        default=RECIFE_PROCUREMENT.get('codigoModalidadeContratacao'),
                        help="Código modalidade (opcional)")
    parser.add_argument('--codigoMunicipioIbge', type=str,
                        default=RECIFE_PROCUREMENT.get('codigoMunicipioIbge'),
                        help="Código município IBGE (opcional)")
    parser.add_argument('--tamanhoPagina', type=int, default=50,
                        help="Tamanho página (padrão: 50)")
    parser.add_argument('--maxPages', type=int, default=None,
                        help='Máximo de páginas (opcional)')

    args = parser.parse_args()

    configure_logging(component="extract")

    params = {
        'dataInicial': args.dataInicial,
        'dataFinal': args.dataFinal,
        'tamanhoPagina': args.tamanhoPagina,
        'pagina': '1',
    }

    if args.codigoModalidadeContratacao:
        params['codigoModalidadeContratacao'] = args.codigoModalidadeContratacao

    if args.codigoMunicipioIbge:
        params['codigoMunicipioIbge'] = args.codigoMunicipioIbge

    worker = ExtractWorker()
    worker.run(params, max_pages=args.maxPages)
```

- [ ] **Step 5: Run the tests to verify they pass**

Run (from `server/`): `pytest tests/test_etl_logging.py tests/test_worker_logging.py -v`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/app/etl/extract.py server/app/workers/extract_worker.py server/tests/test_etl_logging.py server/tests/test_worker_logging.py
git commit -m "feat: structured logging for the extract stage

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Wire the transform stage

**Files:**
- Modify: `server/app/workers/transform_worker.py`
- Test: `server/tests/test_worker_logging.py` (append)

**Interfaces:**
- Consumes: `get_logger`, `configure_logging`.
- Produces: module-level `logger = get_logger("transform")`; `delivery_report(err, msg)` logs `delivery_failed`.

> Note: `etl/transform.py` has no `print()` calls and `transform_record` intentionally raises so the worker can route failures to the DLQ — it is left unchanged.

- [ ] **Step 1: Write the failing test (append to `test_worker_logging.py`)**

Append to `server/tests/test_worker_logging.py`:

```python


def test_transform_delivery_report_logs_failure(caplog):
    from app.workers import transform_worker

    with caplog.at_level(logging.ERROR, logger="ppo.transform"):
        transform_worker.delivery_report("broker down", _FakeMsg())

    events = [getattr(r, "event", None) for r in caplog.records]
    assert "delivery_failed" in events
```

- [ ] **Step 2: Run the test to verify it fails**

Run (from `server/`): `pytest tests/test_worker_logging.py::test_transform_delivery_report_logs_failure -v`
Expected: FAIL (current `delivery_report` only `print`s and emits no `delivery_failed` event).

- [ ] **Step 3: Update `transform_worker.py`**

Replace the full contents of `server/app/workers/transform_worker.py` with:

```python
"""Transform Worker - Kafka Consumer/Producer for data normalization."""
import argparse
import json
import time
from typing import Optional

from confluent_kafka import Consumer, Producer

from app.etl.transform import Transform
from app.infrastructure.config import (
    KAFKA_TOPICS,
    PRODUCER_CONFIG,
    TRANSFORM_CONSUMER_CONFIG,
)
from app.infrastructure.logging_config import configure_logging, get_logger

logger = get_logger("transform")


def delivery_report(err, msg):
    """Delivery report callback."""
    if err is not None:
        logger.error(
            "Falha na entrega da mensagem ao Kafka",
            extra={
                "event": "delivery_failed",
                "topic": msg.topic() if msg is not None else None,
                "error": str(err),
            },
        )


class TransformWorker:
    def __init__(self):
        self.consumer = Consumer(TRANSFORM_CONSUMER_CONFIG)
        self.producer = Producer(PRODUCER_CONFIG)
        self.transformer = Transform()

        self.consumer.subscribe([KAFKA_TOPICS["raw_licitacoes"]])
        logger.info(
            "Inscrito no tópico de entrada",
            extra={"event": "subscribed", "topic": KAFKA_TOPICS["raw_licitacoes"]},
        )

    def run(
        self,
        timeout_ms: int = 1000,
        max_idle_polls: Optional[int] = None,
        max_messages: Optional[int] = None,
    ):
        """Consume raw.licitacoes, transform, produce transformed.licitacoes."""
        processed_count = 0
        error_count = 0
        idle_polls = 0
        started = time.monotonic()

        logger.info("Transformação iniciada", extra={"event": "stage_start"})

        try:
            while True:
                msg = self.consumer.poll(timeout=timeout_ms / 1000)

                if msg is None:
                    idle_polls += 1
                    if max_idle_polls and idle_polls >= max_idle_polls:
                        logger.info(
                            "Encerrando por ociosidade",
                            extra={"event": "idle_shutdown", "idle_polls": idle_polls},
                        )
                        break
                    continue

                idle_polls = 0

                if msg.error():
                    if msg.error().code() != -191:  # _PARTITION_EOF
                        logger.warning(
                            "Erro reportado pelo Kafka",
                            extra={"event": "kafka_error", "error": str(msg.error())},
                        )
                    continue

                try:
                    record = json.loads(msg.value().decode("utf-8"))
                    transformed = self.transformer.transform_record(record)

                    message = json.dumps(transformed, ensure_ascii=False, default=str)
                    key = transformed.get("numero_controle_pncp", "")

                    self.producer.produce(
                        topic=KAFKA_TOPICS["transformed_licitacoes"],
                        value=message.encode("utf-8"),
                        key=key.encode("utf-8"),
                        callback=delivery_report,
                    )

                    self.consumer.commit(asynchronous=True)
                    processed_count += 1
                    logger.debug(
                        "Registro transformado",
                        extra={"event": "record_transformed", "key": key, "processed_count": processed_count},
                    )

                    if processed_count % 10 == 0:
                        self.producer.flush(timeout=5)
                        logger.info(
                            "Progresso de transformação",
                            extra={"event": "transform_progress", "count": processed_count},
                        )

                    if max_messages and processed_count >= max_messages:
                        logger.info(
                            "Limite de mensagens atingido",
                            extra={"event": "max_messages_reached", "count": processed_count},
                        )
                        break

                except Exception as exc:
                    error_record = {
                        "error": str(exc),
                        "original_message": msg.value().decode("utf-8", errors="ignore"),
                        "timestamp": str(msg.timestamp()),
                    }
                    error_message = json.dumps(error_record, ensure_ascii=False, default=str)

                    self.producer.produce(
                        topic=KAFKA_TOPICS["transformed_licitacoes_dlq"],
                        value=error_message.encode("utf-8"),
                        callback=delivery_report,
                    )

                    self.consumer.commit(asynchronous=True)
                    error_count += 1
                    logger.warning(
                        "Registro enviado para a DLQ",
                        extra={
                            "event": "dlq_sent",
                            "dlq_topic": KAFKA_TOPICS["transformed_licitacoes_dlq"],
                            "reason": str(exc),
                        },
                    )

        except KeyboardInterrupt:
            logger.info(
                "Transformação interrompida manualmente",
                extra={"event": "interrupted", "count": processed_count, "error_count": error_count},
            )
        finally:
            self.producer.flush(timeout=10)
            self.consumer.close()
            logger.info(
                "Transformação finalizada",
                extra={
                    "event": "stage_end",
                    "count": processed_count,
                    "error_count": error_count,
                    "duration_ms": round((time.monotonic() - started) * 1000),
                },
            )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Transform PNCP data")
    parser.add_argument("--timeout", type=int, default=1000, help="Timeout em ms")
    parser.add_argument(
        "--maxIdlePolls",
        type=int,
        default=None,
        help="Encerra apos N polls sem mensagens (opcional)",
    )
    parser.add_argument(
        "--maxMessages",
        type=int,
        default=None,
        help="Encerra apos processar N mensagens (opcional)",
    )

    args = parser.parse_args()

    configure_logging(component="transform")

    worker = TransformWorker()
    worker.run(
        timeout_ms=args.timeout,
        max_idle_polls=args.maxIdlePolls,
        max_messages=args.maxMessages,
    )
```

- [ ] **Step 4: Run the test to verify it passes**

Run (from `server/`): `pytest tests/test_worker_logging.py -v`
Expected: PASS (all worker tests).

- [ ] **Step 5: Commit**

```bash
git add server/app/workers/transform_worker.py server/tests/test_worker_logging.py
git commit -m "feat: structured logging for the transform stage

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Wire the load stage

**Files:**
- Modify: `server/app/etl/load.py`
- Modify: `server/app/workers/load_worker.py`
- Test: `server/tests/test_worker_logging.py` (append)

**Interfaces:**
- Consumes: `get_logger`, `configure_logging`.
- Produces: module-level `logger = get_logger("load")` in both files; `LoadWorker._persist_batch(batch) -> bool` logs `batch_persisted`.

- [ ] **Step 1: Write the failing test (append to `test_worker_logging.py`)**

Append to `server/tests/test_worker_logging.py`:

```python


def test_load_persist_batch_logs_batch_persisted(caplog):
    from app.workers.load_worker import LoadWorker

    worker = object.__new__(LoadWorker)  # bypass Kafka consumer construction

    class _FakeLoader:
        def batch_persist(self, batch):
            return {
                "sqlite": {"inserted": 2, "updated": 1, "errors": 0},
                "mongodb": {"inserted": 3, "errors": 0},
                "total_records": 3,
                "success": True,
            }

    worker.loader = _FakeLoader()

    with caplog.at_level(logging.INFO, logger="ppo.load"):
        ok = worker._persist_batch([{"numero_controle_pncp": "PNCP-1"}])

    assert ok is True
    events = [getattr(r, "event", None) for r in caplog.records]
    assert "batch_persisted" in events
```

- [ ] **Step 2: Run the test to verify it fails**

Run (from `server/`): `pytest tests/test_worker_logging.py::test_load_persist_batch_logs_batch_persisted -v`
Expected: FAIL (no `batch_persisted` event emitted).

- [ ] **Step 3: Update `etl/load.py`**

In `server/app/etl/load.py`, add the logger import and instance near the top, then replace the two silent `except` blocks. Apply these edits:

Replace the import block:

```python
from app.infrastructure.database import client, get_sqlite_connection
from typing import Dict, Any, List
from datetime import datetime
import sqlite3
```

with:

```python
from datetime import datetime
from typing import Any, Dict, List
import sqlite3

from app.infrastructure.database import client, get_sqlite_connection
from app.infrastructure.logging_config import get_logger

logger = get_logger("load")
```

Replace the per-record SQLite error handler:

```python
                except sqlite3.Error:
                    errors += 1
```

with:

```python
                except sqlite3.Error:
                    logger.warning(
                        "Falha ao gravar registro no SQLite",
                        extra={"event": "sqlite_record_error", "key": record.get('numero_controle_pncp')},
                        exc_info=True,
                    )
                    errors += 1
```

Replace the outer SQLite error handler:

```python
        except sqlite3.Error:
            return {'inserted': inserted, 'updated': updated, 'errors': len(records)}
```

with:

```python
        except sqlite3.Error:
            logger.error(
                "Falha de conexão/transação no SQLite",
                extra={"event": "error"},
                exc_info=True,
            )
            return {'inserted': inserted, 'updated': updated, 'errors': len(records)}
```

Replace the MongoDB error handler:

```python
        except Exception:
            return {'inserted': 0, 'errors': len(records)}
```

with:

```python
        except Exception:
            logger.error(
                "Falha ao gravar lote no MongoDB",
                extra={"event": "error"},
                exc_info=True,
            )
            return {'inserted': 0, 'errors': len(records)}
```

- [ ] **Step 4: Update `load_worker.py`**

Replace the full contents of `server/app/workers/load_worker.py` with:

```python
import argparse
import json
import time
from typing import Optional

from confluent_kafka import Consumer

from app.etl.load import Load
from app.infrastructure.config import KAFKA_TOPICS, LOAD_CONSUMER_CONFIG
from app.infrastructure.logging_config import configure_logging, get_logger

logger = get_logger("load")


class LoadWorker:
    def __init__(self):
        self.consumer = Consumer(LOAD_CONSUMER_CONFIG)
        self.loader = Load()

        self.consumer.subscribe([KAFKA_TOPICS["transformed_licitacoes"]])
        logger.info(
            "Inscrito no tópico de entrada",
            extra={"event": "subscribed", "topic": KAFKA_TOPICS["transformed_licitacoes"]},
        )

    def run(
        self,
        timeout_ms: int = 1000,
        batch_size: int = 10,
        max_idle_polls: Optional[int] = None,
        max_messages: Optional[int] = None,
    ):
        """Consume transformed data and persist to SQLite/MongoDB."""
        processed_count = 0
        error_count = 0
        idle_polls = 0
        batch = []
        started = time.monotonic()

        logger.info("Carga iniciada", extra={"event": "stage_start", "batch_size": batch_size})

        try:
            while True:
                msg = self.consumer.poll(timeout=timeout_ms / 1000)

                if msg is None:
                    idle_polls += 1
                    if batch:
                        success = self._persist_batch(batch)
                        if success:
                            self.consumer.commit(asynchronous=True)
                            processed_count += len(batch)
                        else:
                            error_count += len(batch)
                        batch = []

                    if max_idle_polls and idle_polls >= max_idle_polls:
                        logger.info(
                            "Encerrando por ociosidade",
                            extra={"event": "idle_shutdown", "idle_polls": idle_polls},
                        )
                        break
                    continue

                idle_polls = 0

                if msg.error():
                    if msg.error().code() != -191:  # _PARTITION_EOF
                        logger.warning(
                            "Erro reportado pelo Kafka",
                            extra={"event": "kafka_error", "error": str(msg.error())},
                        )
                    continue

                try:
                    record = json.loads(msg.value().decode("utf-8"))
                    batch.append(record)

                    if len(batch) >= batch_size:
                        success = self._persist_batch(batch)
                        if success:
                            self.consumer.commit(asynchronous=True)
                            processed_count += len(batch)
                        else:
                            error_count += len(batch)
                        batch = []

                    if max_messages and processed_count >= max_messages:
                        logger.info(
                            "Limite de mensagens atingido",
                            extra={"event": "max_messages_reached", "count": processed_count},
                        )
                        break

                except Exception:
                    error_count += 1
                    logger.error("Erro ao processar registro", extra={"event": "error"}, exc_info=True)

        except KeyboardInterrupt:
            logger.info(
                "Carga interrompida manualmente",
                extra={"event": "interrupted", "count": processed_count, "error_count": error_count},
            )
        finally:
            if batch:
                self._persist_batch(batch)
            self.consumer.close()
            logger.info(
                "Carga finalizada",
                extra={
                    "event": "stage_end",
                    "count": processed_count,
                    "error_count": error_count,
                    "duration_ms": round((time.monotonic() - started) * 1000),
                },
            )

    def _persist_batch(self, batch: list) -> bool:
        """Persist a batch to SQLite and MongoDB; log structured results."""
        try:
            result = self.loader.batch_persist(batch)

            sqlite_res = result["sqlite"]
            mongodb_res = result["mongodb"]
            total = result["total_records"]

            logger.info(
                "Lote persistido",
                extra={
                    "event": "batch_persisted",
                    "batch_size": total,
                    "sqlite_inserted": sqlite_res["inserted"],
                    "sqlite_updated": sqlite_res["updated"],
                    "sqlite_errors": sqlite_res["errors"],
                    "mongodb_inserted": mongodb_res["inserted"],
                    "mongodb_errors": mongodb_res["errors"],
                    "success": result["success"],
                },
            )

            return result["success"]

        except Exception:
            logger.error("Erro ao persistir lote", extra={"event": "error"}, exc_info=True)
            return False


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Load PNCP data to database")
    parser.add_argument("--timeout", type=int, default=1000, help="Timeout em ms")
    parser.add_argument("--batchSize", type=int, default=10, help="Tamanho do lote")
    parser.add_argument(
        "--maxIdlePolls",
        type=int,
        default=None,
        help="Encerra apos N polls sem mensagens (opcional)",
    )
    parser.add_argument(
        "--maxMessages",
        type=int,
        default=None,
        help="Encerra apos processar N mensagens (opcional)",
    )

    args = parser.parse_args()

    configure_logging(component="load")

    worker = LoadWorker()
    worker.run(
        timeout_ms=args.timeout,
        batch_size=args.batchSize,
        max_idle_polls=args.maxIdlePolls,
        max_messages=args.maxMessages,
    )
```

- [ ] **Step 5: Run the tests to verify they pass**

Run (from `server/`): `pytest tests/ -v`
Expected: PASS (entire suite green).

- [ ] **Step 6: Commit**

```bash
git add server/app/etl/load.py server/app/workers/load_worker.py server/tests/test_worker_logging.py
git commit -m "feat: structured logging for the load stage

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Wire the orchestrator (run_id propagation)

**Files:**
- Modify: `server/app/orchestrate_prefect.py`
- Test: `server/tests/test_orchestrator_logging.py`

**Interfaces:**
- Consumes: `configure_logging`, `get_logger`, `resolve_run_id` from `app.infrastructure.logging_config`.
- Produces: `_ensure_run_logging() -> logging.Logger` — sets `os.environ["PPO_RUN_ID"]` if unset, configures logging, returns the orchestrator logger.

- [ ] **Step 1: Write the failing test**

Create `server/tests/test_orchestrator_logging.py`:

```python
import os

from app.orchestrate_prefect import _ensure_run_logging


def test_ensure_run_logging_sets_run_id(monkeypatch, tmp_path):
    monkeypatch.delenv("PPO_RUN_ID", raising=False)
    monkeypatch.setenv("LOG_DIR", str(tmp_path))

    logger = _ensure_run_logging()

    assert os.environ.get("PPO_RUN_ID")
    assert logger.name == "ppo.orchestrator"
```

- [ ] **Step 2: Run the test to verify it fails**

Run (from `server/`): `pytest tests/test_orchestrator_logging.py -v`
Expected: FAIL with `ImportError: cannot import name '_ensure_run_logging'`.

- [ ] **Step 3: Update `orchestrate_prefect.py`**

Add to the imports block of `server/app/orchestrate_prefect.py` (alongside the existing `from app.infrastructure...` imports):

```python
from app.infrastructure.logging_config import configure_logging, get_logger, resolve_run_id
```

Add this helper just after the `SERVER_DIR = Path(__file__).resolve().parents[1]` line:

```python


def _ensure_run_logging():
    """Generate + propagate the run_id and configure file logging once."""
    if not os.environ.get("PPO_RUN_ID"):
        os.environ["PPO_RUN_ID"] = resolve_run_id()
    configure_logging()
    return get_logger("orchestrator")
```

In `procurement_etl_flow`, replace the first two lines of the body:

```python
    logger = get_run_logger()
    resolved_params = params or RECIFE_PROCUREMENT

    logger.info("Pipeline ETL iniciado.")
```

with:

```python
    logger = get_run_logger()
    file_logger = _ensure_run_logging()
    resolved_params = params or RECIFE_PROCUREMENT

    logger.info("Pipeline ETL iniciado.")
    file_logger.info("Pipeline ETL iniciado", extra={"event": "pipeline_start", "mode": "batch"})
```

And replace its final block:

```python
    logger.info("Pipeline ETL finalizado: %s", result)
    return result
```

with:

```python
    logger.info("Pipeline ETL finalizado: %s", result)
    file_logger.info("Pipeline ETL finalizado", extra={"event": "pipeline_end", "mode": "batch", **result})
    return result
```

In `procurement_streaming_flow`, replace the first lines of the body:

```python
    logger = get_run_logger()
    resolved_params = params or RECIFE_PROCUREMENT

    logger.info("Pipeline streaming iniciado via Prefect + Kafka workers.")
```

with:

```python
    logger = get_run_logger()
    file_logger = _ensure_run_logging()
    resolved_params = params or RECIFE_PROCUREMENT

    logger.info("Pipeline streaming iniciado via Prefect + Kafka workers.")
    file_logger.info("Pipeline streaming iniciado", extra={"event": "pipeline_start", "mode": "streaming"})
```

And replace its final block:

```python
    logger.info("Pipeline streaming finalizado: %s", result)
    return result
```

with:

```python
    logger.info("Pipeline streaming finalizado: %s", result)
    file_logger.info("Pipeline streaming finalizado", extra={"event": "pipeline_end", "mode": "streaming"})
    return result
```

> The workers are launched as subprocesses via `_worker_env()`, which copies `os.environ`; because `PPO_RUN_ID` is set before they start, every stage shares the same `run_id`.

- [ ] **Step 4: Run the test to verify it passes**

Run (from `server/`): `pytest tests/test_orchestrator_logging.py -v`
Expected: PASS.

- [ ] **Step 5: Run the full suite**

Run (from `server/`): `pytest tests/ -v`
Expected: PASS (all tests).

- [ ] **Step 6: Commit**

```bash
git add server/app/orchestrate_prefect.py server/tests/test_orchestrator_logging.py
git commit -m "feat: propagate run_id and configure file logging in the orchestrator

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Document the logging system

**Files:**
- Modify: `server/README.md`

**Interfaces:**
- Consumes: nothing.
- Produces: a "Logs" section in the README.

- [ ] **Step 1: Add a Logs section to `server/README.md`**

Append the following section to `server/README.md`:

```markdown
## Logs

O pipeline grava logs estruturados em **JSON Lines** localmente (um objeto JSON por linha).

- Diretório (configurável via `LOG_DIR`, padrão `./logs/`):
  - `extract.log`, `transform.log`, `load.log` — um arquivo por estágio
  - `pipeline.log` — visão agregada de todos os estágios
- Cada linha contém: `ts`, `level`, `component`, `run_id`, `event`, `message` e campos
  contextuais (ex.: `topic`, `partition`, `offset`, contadores). Erros incluem `error.{type,message,stack}`.
- `run_id` correlaciona todos os estágios de uma mesma execução (o orquestrador gera e propaga
  via a variável de ambiente `PPO_RUN_ID`).
- Configuração via ambiente: `LOG_DIR`, `LOG_LEVEL` (padrão `INFO`), `LOG_MAX_BYTES` (10 MB),
  `LOG_BACKUP_COUNT` (5), `LOG_TO_CONSOLE` (`true`).

Consultas rápidas com `jq`:

```bash
# Erros de qualquer estágio em uma execução
grep '"level":"ERROR"' logs/pipeline.log | jq 'select(.run_id=="<run_id>")'

# Quantos registros foram persistidos por lote
jq 'select(.event=="batch_persisted") | .sqlite_inserted' logs/load.log
```
```

- [ ] **Step 2: Commit**

```bash
git add server/README.md
git commit -m "docs: document the structured logging system

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- §3 Architecture (module, loggers, handlers, env config) → Tasks 1, 2. ✅
- §4 Event schema (base fields, run_id, error serialization, event table) → Task 2 (formatter/filter) + Tasks 3–6 (event emission). ✅
- §5 Code changes (extract, extract_worker, transform_worker, load_worker, load, transform, orchestrator) → Tasks 3, 4, 5, 6 (transform.py intentionally unchanged — documented in Task 4). ✅
- §6 Tests (formatter JSON+traceback, idempotency, routing, run_id) → Task 2. ✅
- §7 `.gitignore logs/` + `pytest` in requirements → Task 1. ✅
- §9 Limitation (best-effort aggregated pipeline.log) → respected; no multiprocess handler added. ✅

**Placeholder scan:** No TBD/TODO/"handle edge cases"/"similar to" — every code step contains full code. ✅

**Type/name consistency:** `get_logger`, `configure_logging(component=...)`, `resolve_run_id`, `reset_logging`, `RunIdFilter`, `JsonLinesFormatter`, `HumanFormatter`, `ROOT_LOGGER_NAME="ppo"`, `STAGES`, event names, and `LoadWorker._persist_batch` are used identically across the module, tests, workers, and orchestrator. ✅
