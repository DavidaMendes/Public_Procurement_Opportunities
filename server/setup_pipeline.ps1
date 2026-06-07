# Setup Script - Windows PowerShell
# Execute: .\setup_pipeline.ps1

Write-Host "=== Setup Pipeline ETL com Kafka ===" -ForegroundColor Green

# 1. Instalar dependências
Write-Host "`n[1] Instalando dependências..." -ForegroundColor Cyan
pip install -r requirements.txt -q
if ($?) { Write-Host "✓ Dependências instaladas" -ForegroundColor Green }

# 2. Inicializar banco de dados
Write-Host "`n[2] Inicializando banco SQLite..." -ForegroundColor Cyan
$env:PYTHONPATH = "."
python -c "from app.core.database import init_sqlite_db; init_sqlite_db()"
if ($?) { Write-Host "✓ Banco de dados inicializado" -ForegroundColor Green }

# 3. Informar próximos passos
Write-Host "`n[3] Próximas etapas:" -ForegroundColor Cyan
Write-Host "   - Subir Kafka: cd kafka && docker compose up -d"
Write-Host "   - Terminal 1 (Extract):   .\run_extract.ps1"
Write-Host "   - Terminal 2 (Transform): .\run_transform.ps1"
Write-Host "   - Terminal 3 (Load):      .\run_load.ps1"
Write-Host "`n✓ Setup concluído!" -ForegroundColor Green
