Write-Host "=== Setup Pipeline ETL com Kafka ===" -ForegroundColor Green

Write-Host "`n[1] Instalando dependências..." -ForegroundColor Cyan
pip install -r requirements.txt -q
if ($?) { Write-Host "✓ Dependências instaladas" -ForegroundColor Green }

Write-Host "`n[2] Inicializando banco SQLite..." -ForegroundColor Cyan
$env:PYTHONPATH = "."
python -c "from app.infrastructure.database import init_sqlite_db; init_sqlite_db()"
if ($?) { Write-Host "✓ Banco de dados inicializado" -ForegroundColor Green }

Write-Host "`n[3] Próximas etapas:" -ForegroundColor Cyan
Write-Host "   - Subir Kafka: cd infrastructure/kafka && docker compose up -d"
Write-Host "   - Terminal 1 (Extract):   .\scripts\run_extract.ps1"
Write-Host "   - Terminal 2 (Transform): .\scripts\run_transform.ps1"
Write-Host "   - Terminal 3 (Load):      .\scripts\run_load.ps1"
Write-Host "`n✓ Setup concluído!" -ForegroundColor Green
