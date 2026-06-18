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
        prefix = ROOT_LOGGER_NAME + "."
        component = record.name[len(prefix):] if record.name.startswith(prefix) else record.name
        payload = {
            "ts": ts.strftime("%Y-%m-%dT%H:%M:%S.") + f"{int(record.msecs):03d}Z",
            "level": record.levelname,
            "component": component,
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
