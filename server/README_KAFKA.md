# Pipeline ETL com Apache Kafka

## Visão Geral

Este pipeline ETL desacoplado extrai dados do Portal Nacional de Contratações Públicas (PNCP), transforma-os e carrega em um banco de dados, utilizando Apache Kafka como broker de mensagens.

### Arquitetura

```
┌──────────────────────────────────────────────────────────────────┐
│                        KAFKA BROKER                              │
│                                                                  │
│  raw.licitacoes         →   transformed.licitacoes               │
│  raw.licitacoes.dlq         transformed.licitacoes.dlq           │
└──────────────────────────────────────────────────────────────────┘
        ▲                              │                    │
        │                             ▼                    ▼
┌───────────────┐          ┌──────────────────┐   ┌──────────────┐
│ EXTRACT WORKER│          │ TRANSFORM WORKER │   │  LOAD WORKER │
│  (Producer)   │          │  (Consumer +     │   │  (Consumer)  │
│               │          │   Producer)      │   │              │
│ API PNCP      │          │ Normalização     │   │  SQLite      │
│               │          │ Date convert     │   │  MongoDB     │
└───────────────┘          └──────────────────┘   └──────────────┘
```

## Tópicos Kafka

| Tópico | Produtor | Consumidor | Descrição |
|--------|----------|-----------|-----------|
| `raw.licitacoes` | Extract Worker | Transform Worker | JSON bruto da API PNCP |
| `transformed.licitacoes` | Transform Worker | Load Worker | Registros normalizados e tipados |
| `raw.licitacoes.dlq` | Extract Worker | Monitoramento | Erros de extração |
| `transformed.licitacoes.dlq` | Transform Worker | Monitoramento | Erros de transformação |

## Estrutura de Pastas

```
server/
├── app/
│   ├── core/
│   │   ├── database.py         (SQLite + MongoDB)
│   │   ├── settings.py         (Configurações gerais)
│   │   └── exceptions.py
│   ├── etl/
│   │   ├── extract.py          (Extração com paginação)
│   │   ├── transform.py        (Normalização de dados)
│   │   └── load.py             (Upsert em SQLite)
│   └── workers/
│       ├── extract_worker.py   (Kafka Producer)
│       ├── transform_worker.py (Consumer + Producer)
│       └── load_worker.py      (Kafka Consumer)
├── config/
│   └── kafka_config.py         (Configurações Kafka centralizadas)
├── kafka/
│   └── docker-compose.yml      (Zookeeper + Kafka)
└── requirements.txt            (Dependências)
```

## Instalação

### 1. Instalar Dependências

```bash
cd server
pip install -r requirements.txt
```

### 2. Subir Infraestrutura Kafka

```bash
cd kafka
docker compose up -d

# Verificar se está saudável
docker compose ps
```

### 3. Inicializar Banco de Dados SQLite

```bash
python -c "from app.core.database import init_sqlite_db; init_sqlite_db()"
```

## Execução

### Opção 1: Executar Workers em Terminais Separados

**Terminal 1 — Extract Worker:**
```bash
python app/workers/extract_worker.py \
  --dataInicial 20240101 \
  --dataFinal 20240131 \
  --tamanhoPagina 50 \
  --maxPages 5
```

**Terminal 2 — Transform Worker:**
```bash
python app/workers/transform_worker.py --timeout 1000
```

**Terminal 3 — Load Worker:**
```bash
python app/workers/load_worker.py --timeout 1000 --batchSize 10
```

### Opção 2: Usar Script Paralelo (recomendado)

Crie um script `run_pipeline.sh`:

```bash
#!/bin/bash

# Inicializar DB
python -c "from app.core.database import init_sqlite_db; init_sqlite_db()"

# Rodar workers em background
python app/workers/extract_worker.py --dataInicial 20240101 --dataFinal 20240131 --maxPages 5 &
EXTRACT_PID=$!

sleep 2

python app/workers/transform_worker.py &
TRANSFORM_PID=$!

sleep 2

python app/workers/load_worker.py &
LOAD_PID=$!

echo "Pipeline rodando (PIDs: $EXTRACT_PID, $TRANSFORM_PID, $LOAD_PID)"
wait
```

Execute com:
```bash
chmod +x run_pipeline.sh
./run_pipeline.sh
```

## Monitoramento

### Verificar Mensagens em um Tópico

```bash
docker exec -it kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic raw.licitacoes \
  --from-beginning \
  --max-messages 5
```

### Verificar Erros (DLQ)

```bash
docker exec -it kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic raw.licitacoes.dlq \
  --from-beginning
```

### Consultar Banco de Dados

```bash
sqlite3 data/licitacoes.db

-- Ver quantidade de registros
SELECT COUNT(*) FROM licitacoes;

-- Ver registros por modalidade
SELECT modalidade, COUNT(*) FROM licitacoes GROUP BY modalidade;

-- Ver registros por ano-mês
SELECT ano_mes, COUNT(*) FROM licitacoes GROUP BY ano_mes;
```

## Esquema SQLite

```sql
CREATE TABLE licitacoes (
    id INTEGER PRIMARY KEY,
    numero_controle_pncp TEXT UNIQUE NOT NULL,
    orgao_cnpj TEXT,
    orgao_razao_social TEXT,
    data_publicacao DATE,
    valor_total_estimado REAL,
    modalidade TEXT,
    situacao_compra TEXT,
    objeto_compra TEXT,
    ano_mes TEXT,
    extracted_at TIMESTAMP,
    pagina INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Fluxo de Dados

### 1. Extract Worker (Producer)

- Faz requisições paginadas à API PNCP
- Para cada licitação, publica uma mensagem JSON no `raw.licitacoes`
- Em caso de erro: envia para `raw.licitacoes.dlq`

**Payload:**
```json
{
  "extracted_at": "2024-01-15T10:00:00Z",
  "pagina": 1,
  "payload": {
    "numeroControlePNCP": "...",
    "orgaoEntidade": { "cnpj": "...", "razaoSocial": "..." },
    "dataPublicacaoPncp": "2024-01-10",
    "valorTotalEstimado": 150000.00,
    "modalidadeNome": "Pregão Eletrônico",
    "situacaoCompraNome": "Divulgada no PNCP",
    "objetoCompra": "Aquisição de materiais de escritório"
  }
}
```

### 2. Transform Worker (Consumer + Producer)

- Consome mensagens de `raw.licitacoes`
- Aplica transformações:
  - Converte datas para `YYYY-MM-DD`
  - Normaliza campos para `snake_case`
  - Remove acentuação de modalidades e situações
  - Extrai `ano_mes` no formato `YYYY-MM`
  - Converte `valorTotalEstimado` para `float`
- Publica em `transformed.licitacoes`
- Em caso de erro: envia para `transformed.licitacoes.dlq`

**Payload transformado:**
```json
{
  "numero_controle_pncp": "...",
  "orgao_cnpj": "...",
  "orgao_razao_social": "...",
  "data_publicacao": "2024-01-10",
  "valor_total_estimado": 150000.0,
  "modalidade": "pregao_eletronico",
  "situacao_compra": "divulgada_no_pncp",
  "objeto_compra": "Aquisição de materiais de escritório",
  "ano_mes": "2024-01",
  "extracted_at": "2024-01-15T10:00:00Z",
  "pagina": 1
}
```

### 3. Load Worker (Consumer)

- Consome mensagens de `transformed.licitacoes`
- Faz **upsert** no SQLite usando `numero_controle_pncp` como chave única
- Faz commit do offset Kafka apenas após persistência bem-sucedida
- Agrupa registros em lotes (default: 10) para melhor performance

## Configurações

### Variáveis de Ambiente (`.env`)

```env
# Kafka
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# Database
SQLITE_DB_PATH=./data/licitacoes.db
DATABASE_URI=mongodb+srv://user:password@cluster.mongodb.net/procurement

# API PNCP
PNCP_BASE_URL=https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao
```

### Arquivo de Configuração (`config/kafka_config.py`)

Edite conforme necessário:
- `PRODUCER_CONFIG`: Configurações do produtor Kafka
- `CONSUMER_CONFIG`: Configurações do consumidor Kafka
- `KAFKA_TOPICS`: Nomes dos tópicos
- `KAFKA_CONSUMER_GROUPS`: Nomes dos grupos de consumidor

## Tratamento de Erros

- **Dead Letter Queue (DLQ)**: Mensagens com erro vão para `*.dlq`
- **Retry automático**: Produtor tenta 3 vezes antes de desistir
- **Commit apenas após sucesso**: Load Worker só faz commit após persistência bem-sucedida

## Performance

- **Extract Worker**: ~0.5s por página (rate limiting)
- **Transform Worker**: Processa 10+ registros por flush
- **Load Worker**: Agrupa em lotes de 10 (configurável via `--batchSize`)

## Troubleshooting

### Kafka não inicia
```bash
docker compose logs kafka
docker compose restart kafka
```

### Erro de conexão
```bash
# Verificar se Kafka está escutando
netstat -an | grep 9092
```

### Banco de dados bloqueado
```bash
# Reiniciar o Load Worker
pkill -f load_worker.py
```

### Verificar logs do container
```bash
docker logs -f kafka
docker logs -f zookeeper
```

## Próximos Passos

1. Implementar monitoramento com Prometheus/Grafana
2. Adicionar autenticação SASL/SSL ao Kafka
3. Implementar compactação de tópicos para retenção
4. Adicionar testes unitários e de integração
5. Criar dashboards de visualização dos dados

## Referências

- [Confluent Kafka Python Client](https://docs.confluent.io/kafka-clients/python/current/overview.html)
- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [API PNCP](https://pncp.gov.br/api/consulta/swagger-ui/index.html)
