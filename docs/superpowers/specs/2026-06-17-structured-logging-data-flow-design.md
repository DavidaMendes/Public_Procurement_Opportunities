# Design — Estrutura de logs do fluxo de dados (ETL + Workers)

**Data:** 2026-06-17
**Autor:** Gabriel Rodrigues (com Claude Code)
**Status:** Aprovado para planejamento

## 1. Contexto e objetivo

O servidor (`server/app`) roda um pipeline de dados de licitações da API PNCP com dois modos,
ambos orquestrados por Prefect (`orchestrate_prefect.py`):

- **Streaming (Kafka):** `ExtractWorker` (producer) → tópico `raw.licitacoes` →
  `TransformWorker` (consumer/producer) → tópico `transformed.licitacoes` →
  `LoadWorker` (consumer) → SQLite + MongoDB. Há tópicos DLQ (`*.dlq`) para mensagens com erro.
- **Batch:** as classes ETL (`Extract`/`Transform`/`Load`) rodam em processo via tasks Prefect.

Hoje a observabilidade é feita com `print()` espalhados (`[OK]`, `[ERRO]`, `[AVISO]`, `[✓]`, `[✗]`)
nas classes ETL e nos workers; apenas o caminho batch usa `get_run_logger()` do Prefect. Não há
persistência local estruturada dos eventos do fluxo.

**Objetivo:** implementar uma estrutura de logs que cubra o fluxo real (classes ETL + workers),
respeitando a natureza de *data streaming*, gravando os logs **localmente** em formato consultável.

## 2. Decisões (confirmadas com o usuário)

1. **Formato:** JSON Lines (1 objeto JSON por linha) nos arquivos; **console legível** para o dev.
2. **Organização:** um arquivo por componente — `extract.log`, `transform.log`, `load.log` —
   mais um agregado `pipeline.log`. Todos com rotação por tamanho.
3. **Abrangência:** substituir todos os `print()` por logging estruturado **e** adicionar métricas
   relevantes ao streaming (contagens, topic/partition/offset, throughput, DLQ, duração, erros com stack).
4. **Agregado em streaming:** `RotatingFileHandler` da stdlib (best-effort), **sem dependência nova**.
   Os arquivos por estágio (single-writer) são a fonte durável e 100% segura; o `pipeline.log` agregado
   tem risco desprezível de colisão de rotação no volume atual — documentado como limitação conhecida.

## 3. Arquitetura

Módulo central `app/infrastructure/logging_config.py` sobre o `logging` da **stdlib** (zero libs novas).
Loggers nomeados por estágio escrevem JSON no arquivo do estágio e propagam para o agregado e o console:

```
ppo.extract     ─┬─→ logs/extract.log     (RotatingFileHandler, JSON)
ppo.transform   ─┼─→ logs/transform.log   (RotatingFileHandler, JSON)
ppo.load        ─┼─→ logs/load.log        (RotatingFileHandler, JSON)
ppo.orchestrator─┘
        todos ──────→ logs/pipeline.log   (agregado, JSON, best-effort)
        todos ──────→ console             (texto legível, opcional via env)
```

- No streaming, cada worker é um processo separado, mas **dono exclusivo do seu arquivo de estágio**
  (extract worker → só `extract.log`), portanto os arquivos por estágio são sempre single-writer
  e seguros com rotação.
- A classe ETL e o worker do mesmo estágio compartilham o logger do estágio
  (`Extract` e `ExtractWorker` → `ppo.extract`), diferenciados pelo campo `event`.
- O logger raiz do pacote (`ppo`) recebe o handler do `pipeline.log` e o handler de console;
  os loggers de estágio (`ppo.<stage>`) recebem o handler do arquivo do estágio e propagam para `ppo`.
  `ppo.propagate = False` para não duplicar no root do Python.

### API do módulo

```python
def get_logger(name: str) -> logging.Logger:
    """Retorna logging.getLogger(f'ppo.{name}'). Ex.: get_logger('extract')."""

def configure_logging(component: str | None = None) -> None:
    """Idempotente. Configura handlers uma vez por processo (sem duplicar).
    Se 'component' for dado (worker avulso), anexa só o arquivo daquele estágio +
    pipeline.log + console; se None (orquestrador/batch), anexa todos os estágios."""
```

> A configuração por `component` evita que um worker (ex.: transform) abra/crie arquivos de estágios
> que ele não usa.

### Configuração via ambiente (em `config.py`)

| Variável            | Default            | Descrição                                  |
|---------------------|--------------------|--------------------------------------------|
| `LOG_DIR`           | `./logs`           | Diretório-raiz dos arquivos de log         |
| `LOG_LEVEL`         | `INFO`             | Nível mínimo                               |
| `LOG_MAX_BYTES`     | `10485760` (10 MB) | Tamanho de rotação por arquivo             |
| `LOG_BACKUP_COUNT`  | `5`                | Quantidade de backups rotacionados         |
| `LOG_TO_CONSOLE`    | `true`             | Liga/desliga o handler de console          |

## 4. Schema do evento (linha JSON)

Campos base presentes em toda linha + campos contextuais por evento:

```json
{"ts":"2026-06-17T21:30:00.123Z","level":"INFO","component":"extract",
 "run_id":"20260617T2130-a1b2","event":"record_published",
 "topic":"raw.licitacoes","partition":0,"offset":42,
 "key":"PNCP-123","count":10,"message":"10 registros publicados"}
```

**Base:** `ts` (ISO8601 UTC), `level`, `component`, `run_id`, `event`, `message`.

**`run_id` (correlação):** id por execução para rastrear uma rodada atravessando os 3 estágios.
O orquestrador gera e propaga aos workers via env `PPO_RUN_ID`; um worker executado avulso gera o seu.
Injetado em todo registro por um `logging.Filter`.

**Erros:** logados com `exc_info=True`; o `JsonLinesFormatter` serializa em
`error.type`, `error.message`, `error.stack`.

**Eventos previstos:**

| Evento              | Estágio    | Campos contextuais                                                        |
|---------------------|------------|--------------------------------------------------------------------------|
| `stage_start`       | todos      | parâmetros de execução                                                    |
| `stage_end`         | todos      | `count`, `error_count`, `duration_ms`                                     |
| `page_fetched`      | extract    | `page`, `record_count`                                                    |
| `record_extracted`  | extract    | `key`, `page`                                                             |
| `record_published`  | extract    | `topic`, `partition`, `offset`, `key`, `count`                           |
| `delivery_failed`   | extract    | `topic`, `error`                                                          |
| `record_transformed`| transform  | `key`, `processed_count`                                                  |
| `batch_persisted`   | load       | `batch_size`, `sqlite_inserted/updated/errors`, `mongodb_inserted/errors`|
| `dlq_sent`          | extract/transform | `dlq_topic`, `reason`                                              |
| `error`             | todos      | `error.type`, `error.message`, `error.stack`                             |

## 5. Mudanças no código existente

Substituição dos `print()` por logging estruturado:

- **`etl/extract.py`** — erro de página → `logger.error(..., exc_info=True)`; eventos
  `page_fetched` / `record_extracted`.
- **`workers/extract_worker.py`** — `delivery_report`, publicações, flush, DLQ e resumo final →
  `record_published`, `delivery_failed`, `dlq_sent`, `stage_end` (com `count`/`error_count`).
- **`workers/transform_worker.py`** — consumo/produção, DLQ e resumo →
  `record_transformed`, `dlq_sent`, `stage_end`.
- **`workers/load_worker.py`** — `_persist_batch` loga `batch_persisted` com contadores de
  SQLite/MongoDB; resumo → `stage_end`.
- **`etl/load.py`** — hoje engole erros de SQLite silenciosamente
  (`except sqlite3.Error: errors += 1`); passa a logar `warning`/`error` com detalhe.
- **`etl/transform.py`** — hot path: loga apenas erro; contagens ficam no worker.
- **`orchestrate_prefect.py`** — mantém `get_run_logger()` do Prefect **e** chama
  `configure_logging()`, gera o `run_id` e o propaga aos subprocessos workers via env `PPO_RUN_ID`,
  para que os logs das classes ETL e dos workers também caiam nos arquivos.

## 6. Testes (TDD)

O projeto ainda não tem `tests/`. Criar `server/tests/` com pytest cobrindo a parte pura e
determinística (sem dependência de Kafka):

1. `JsonLinesFormatter` gera JSON válido com os campos base e serializa traceback em `error.*`.
2. `configure_logging` é idempotente (não duplica handlers ao ser chamado 2x).
3. Roteamento: um log em `ppo.extract` aparece em `extract.log` **e** em `pipeline.log`.
4. `run_id` é injetado em todos os registros (via `PPO_RUN_ID` e via geração automática).

Os workers (dependem de broker Kafka) ficam fora do teste unitário.

`pytest` é adicionado ao `requirements.txt`.

## 7. Itens de configuração do repositório

- Adicionar `logs/` ao `server/.gitignore` (o `*.log` atual não cobre backups rotacionados como
  `extract.log.1`).

## 8. Fora de escopo (YAGNI)

- Envio de logs para serviço externo / agregador remoto (ELK, Datadog etc.).
- Métricas de lag/consumer-group do Kafka via Admin API.
- Dependência `concurrent-log-handler` (rotação multiprocesso estritamente segura) — fica como
  caminho de upgrade documentado, não implementado agora.
- Tracing distribuído (OpenTelemetry).

## 9. Limitações conhecidas

- O `pipeline.log` agregado é escrito por 3 processos no modo streaming; a rotação por tamanho da
  stdlib não é estritamente segura entre processos no instante da rotação. Risco desprezível no
  volume atual; os arquivos por estágio (single-writer) permanecem como fonte durável e segura.
