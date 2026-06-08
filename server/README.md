# ETL Pipeline — PNCP com Apache Kafka

Sistema desacoplado de extração, transformação e carga de licitações públicas federais, estaduais e municipais do Portal Nacional de Contratações Públicas (PNCP), utilizando Apache Kafka como broker de mensagens.

---

## 🚀 Início Rápido

### 1. Setup Inicial

**Windows (PowerShell):**
```powershell
.\scripts\setup.ps1
cd infrastructure/kafka && docker compose up -d && cd ../..
```

**Linux/macOS (Bash):**
```bash
chmod +x scripts/*.sh
./scripts/setup.sh
cd infrastructure/kafka && docker compose up -d && cd ../..
```

### 2. Rodar Pipeline (3 terminais)

**Terminal 1 — Extract (Produtor):**
```powershell
.\scripts\run_extract.ps1 --maxPages 3
```

**Terminal 2 — Transform (Consumer + Produtor):**
```powershell
.\scripts\run_transform.ps1
```

**Terminal 3 — Load (Consumer + Persistência):**
```powershell
.\scripts\run_load.ps1
```

### 3. Verificar Dados

```bash
# SQLite
sqlite3 data/licitacoes.db "SELECT COUNT(*) FROM licitacoes;"

# MongoDB (se configurado)
# Ver em .env: DATABASE_URI
```

---

## 📊 Arquitetura

```
Extract Worker (API PNCP)
    ↓ Kafka: raw.licitacoes
Transform Worker (Normaliza)
    ↓ Kafka: transformed.licitacoes
Load Worker (Persiste)
    ↓
[SQLite] + [MongoDB]
```

### Tópicos Kafka

| Tópico | Fluxo |
|--------|-------|
| `raw.licitacoes` | Extract → Transform |
| `transformed.licitacoes` | Transform → Load |
| `raw.licitacoes.dlq` | Erros de extração |
| `transformed.licitacoes.dlq` | Erros de transformação |

---

## 📁 Estrutura do Projeto

```
server/
├── app/
│   ├── core/
│   │   ├── config.py         # Kafka, DB, API (centralizado)
│   │   ├── database.py       # SQLite + MongoDB
│   │   ├── settings.py       # Backward compatibility
│   │   └── exceptions.py
│   ├── etl/
│   │   ├── extract.py        # Extração com paginação
│   │   ├── transform.py      # Normalização de dados
│   │   └── load.py           # Persistência (SQLite + MongoDB)
│   └── workers/
│       ├── extract_worker.py   # Publica no Kafka
│       ├── transform_worker.py # Consome e publica
│       └── load_worker.py      # Consome e persiste
├── infrastructure/
│   └── kafka/
│       └── docker-compose.yml
├── scripts/
│   ├── setup.ps1 / setup.sh
│   ├── run_extract.ps1 / .sh
│   ├── run_transform.ps1 / .sh
│   └── run_load.ps1 / .sh
├── data/
│   └── licitacoes.db (SQLite auto-criado)
├── requirements.txt
└── README.md
```

---

## 🔄 Como Funciona

### Extract Worker (Produtor)

**Responsabilidade:** Extrair dados da API PNCP e publicar no Kafka

- Faz requisições paginadas: `https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao`
- Publica **1 mensagem por licitação** (não batch)
- Permite reprocessamento paralelo no Transform Worker

**Parâmetros:**
```powershell
.\scripts\run_extract.ps1                         # Usa defaults (Recife)
.\scripts\run_extract.ps1 --dataInicial 20240101 --dataFinal 20240131 --maxPages 10
```

**Defaults em `app/core/config.py`:**
```python
RECIFE_PROCUREMENT = {
    "dataInicial": "20240601",
    "dataFinal": "20240602",
    "codigoMunicipioIbge": "2611606",  # Recife
    "tamanhoPagina": "50",
}
```

---

### Transform Worker (Consumer + Produtor)

**Responsabilidade:** Normalizar cada registro

Transformações automáticas:
- ✅ Datas → `YYYY-MM-DD`
- ✅ Nomes → `snake_case` (ex: `pregao_eletronico`)
- ✅ Remove acentuação
- ✅ Valores → `float`
- ✅ Extrai `ano_mes` do tipo `YYYY-MM`

**Execução:**
```powershell
.\scripts\run_transform.ps1 --timeout 1000
```

---

### Load Worker (Consumer Final)

**Responsabilidade:** Persistir em SQLite e MongoDB

Operações:
- **Upsert SQLite**: Chave única = `numero_controle_pncp`
- **Insert MongoDB**: Sem restrições (histórico)
- Commit Kafka apenas **após** sucesso
- Agrupa em lotes (default: 10)

**Logs:**
```
[✓] 15 licitações salvas em SQLite3 e MongoDB (ins: 12, upd: 3)
[✓] 15 em SQLite3 (ins: 12, upd: 3) | 15 em MongoDB | Total: 15
[⚠] Parcial - SQLite3: 13 (erros: 2) | MongoDB: 14 (erros: 1)
```

**Execução:**
```powershell
.\scripts\run_load.ps1 --timeout 1000 --batchSize 10
```

---

## 💾 Bancos de Dados

### SQLite (data/licitacoes.db)

**Schema com índices:**
```sql
CREATE TABLE licitacoes (
    id INTEGER PRIMARY KEY,
    numero_controle_pncp TEXT UNIQUE,  -- Chave para upsert
    orgao_cnpj TEXT,
    orgao_razao_social TEXT,
    data_publicacao DATE,
    valor_total_estimado REAL,
    modalidade TEXT,
    situacao_compra TEXT,
    objeto_compra TEXT,
    ano_mes TEXT,                      -- Índice para filtros
    extracted_at TIMESTAMP,
    pagina INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_numero_controle ON licitacoes(numero_controle_pncp);
CREATE INDEX idx_ano_mes ON licitacoes(ano_mes);
CREATE INDEX idx_orgao_cnpj ON licitacoes(orgao_cnpj);
```

### MongoDB (opcional)

**Base:** `procurement`  
**Coleção:** `licitacoes` (documentos normalizados idênticos ao SQLite)

---

## ⚙️ Configuração

### Variáveis de Ambiente (`.env`)

```env
# Kafka (opcional se localhost:9092)
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# SQLite (opcional se ./data/)
SQLITE_DB_PATH=./data/licitacoes.db

# MongoDB (opcional)
DATABASE_URI=mongodb+srv://user:password@cluster.mongodb.net/procurement
```

### Configuração em Código

**Arquivo:** `app/core/config.py`

- `RECIFE_PROCUREMENT` — Parâmetros padrão de extração
- `KAFKA_TOPICS` — Nomes dos tópicos
- `KAFKA_CONSUMER_GROUPS` — Grupos de consumidores
- `PRODUCER_CONFIG` / `*_CONSUMER_CONFIG` — Configs Kafka

---

## 🛠️ Comandos Úteis

### Verificar Dados SQLite
```bash
sqlite3 data/licitacoes.db "SELECT COUNT(*) FROM licitacoes;"
sqlite3 data/licitacoes.db "SELECT modalidade, COUNT(*) FROM licitacoes GROUP BY modalidade;"
sqlite3 data/licitacoes.db "SELECT ano_mes, COUNT(*) FROM licitacoes GROUP BY ano_mes;"
```

### Logs Kafka
```bash
docker logs -f kafka
docker logs -f zookeeper
```

### Consumir Tópico (Debug)
```bash
docker exec -it kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic raw.licitacoes \
  --from-beginning \
  --max-messages 5
```

### Parar Kafka
```bash
cd infrastructure/kafka && docker compose down
```

### Reset Completo
```powershell
rm data/licitacoes.db
cd infrastructure/kafka && docker compose down -v && cd ../..
.\scripts\setup.ps1
```

---

## 📋 Requisitos

- Python 3.8+
- Docker + Docker Compose
- pip
- ~2GB RAM mínimo

---

## 📦 Dependências Principais

```
confluent-kafka==2.3.0   # Kafka
pandas>=2.2.0            # Transformação
requests>=2.32.3         # HTTP (API PNCP)
pymongo>=4.6.0           # MongoDB
python-dotenv>=1.0.0     # .env
```

---

## ✅ Boas Práticas Implementadas

- **Separação de responsabilidades**: etl/ (lógica pura) vs workers/ (orquestração)
- **Configuração centralizada**: `app/core/config.py`
- **Error handling**: DLQ para mensagens com erro
- **Logging estruturado**: Logs diferenciados por worker
- **Batch processing**: Melhor performance em persistência
- **Upsert inteligente**: Evita duplicação no SQLite
- **Desacoplamento**: Kafka permite escalar workers independentemente

---

## 🔍 Troubleshooting

| Problema | Solução |
|----------|---------|
| `ModuleNotFoundError: No module named 'confluent_kafka'` | `pip install -r requirements.txt` |
| Kafka não inicia | `cd infrastructure/kafka && docker compose logs kafka` |
| SQLite locked | Parar Load Worker e tentar novamente |
| Extract roda infinito | Usar `--maxPages 3` para limitar |
| Nenhum dado no MongoDB | Verificar `DATABASE_URI` em `.env` |

---

## 📈 Performance Estimada

| Operação | Tempo |
|----------|-------|
| Extract (1 página) | ~0.5s |
| Transform (100 registros) | ~50ms |
| Load (batch de 10) | ~100ms (SQLite + MongoDB) |
| **Pipeline (10 páginas)** | **~2-3 min** |

---

## 🚀 Próximos Passos

- [ ] Adicionar Prometheus para métricas
- [ ] Dashboard Grafana
- [ ] Alertas para DLQ não vazia
- [ ] CI/CD (GitHub Actions)
- [ ] Testes automatizados

---

## 📚 Referências

- [Confluent Kafka Python](https://docs.confluent.io/kafka-clients/python/current/overview.html)
- [Apache Kafka](https://kafka.apache.org/documentation/)
- [API PNCP](https://pncp.gov.br/api/consulta/swagger-ui/index.html)
- [SQLite](https://www.sqlite.org/docs.html)
- [MongoDB Python](https://docs.mongodb.com/drivers/pymongo/)

---

**Última atualização:** Junho 2024  
**Versão:** 1.0 (Estável)
