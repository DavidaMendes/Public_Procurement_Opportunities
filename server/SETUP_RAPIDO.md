# Setup Rápido — ETL Pipeline com Kafka

## Windows (PowerShell) — Recomendado

### Primeira Execução

```powershell
# 1. Execute o setup (instala deps + inicia DB)
.\setup_pipeline.ps1

# 2. Em outro terminal, subir Kafka
cd kafka
docker compose up -d
cd ..

# 3. Em 3 terminais separados, rodar workers (usa RECIFE_PROCUREMENT como padrão)
.\run_extract.ps1 --maxPages 3          # Extract
.\run_transform.ps1                     # Transform
.\run_load.ps1                          # Load
```

### Execuções Posteriores

```powershell
# Apenas rode os workers (Kafka e DB já estão rodando)
.\run_extract.ps1 --maxPages 5
.\run_transform.ps1
.\run_load.ps1
```

### Personalizar Parâmetros

```powershell
# Extract com datas diferentes
.\run_extract.ps1 --dataInicial 20231201 --dataFinal 20231231 --maxPages 10

# Transform e Load com opções padrão (sem argumentos)
.\run_transform.ps1
.\run_load.ps1
```

---

## Linux/Mac (Bash)

```bash
# Setup
chmod +x setup_pipeline.sh
./setup_pipeline.sh

# Subir Kafka
cd kafka && docker compose up -d && cd ..

# Rodar workers
./run_extract.sh --maxPages 3
./run_transform.sh
./run_load.sh
```

---

## Comandos Úteis

### Verificar dados no SQLite
```powershell
sqlite3 data\licitacoes.db "SELECT COUNT(*) FROM licitacoes;"
```

### Ver logs do Kafka
```bash
docker logs -f kafka
```

### Parar Kafka
```bash
cd kafka && docker compose down
```

### Limpar tudo (recomeçar do zero)
```powershell
# Deletar DB
rm data\licitacoes.db

# Deletar volume Kafka
docker compose -f kafka/docker-compose.yml down -v

# Re-executar setup
.\setup_pipeline.ps1
```

---

## Estrutura Atual

```
server/
├── app/
│   ├── config/              ← Movido aqui (antes estava em server/)
│   │   └── kafka_config.py
│   ├── core/
│   ├── etl/
│   └── workers/
├── kafka/
│   └── docker-compose.yml
├── run_extract.ps1          ← Scripts novos
├── run_transform.ps1
├── run_load.ps1
├── setup_pipeline.ps1       ← Setup automático
└── requirements.txt
```

---

## Diferença: Argumentos Opcionais

Agora **todos os argumentos são opcionais** — usa `RECIFE_PROCUREMENT` de `settings.py`:

```powershell
# Sem argumentos: usa defaults de settings.py
.\run_extract.ps1
# Usa: dataInicial=20260430, dataFinal=20260630, codigoMunicipioIbge=2611606

# Com argumentos: sobrescreve
.\run_extract.ps1 --dataInicial 20240101 --dataFinal 20240131 --maxPages 10
```
