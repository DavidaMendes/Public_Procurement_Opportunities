echo "=== Setup Pipeline ETL com Kafka ==="

echo -e "\n[1] Instalando dependências..."
pip install -r requirements.txt -q
if [ $? -eq 0 ]; then echo "✓ Dependências instaladas"; fi

echo -e "\n[2] Inicializando banco SQLite..."
PYTHONPATH=. python -c "from app.infrastructure.database import init_sqlite_db; init_sqlite_db()"
if [ $? -eq 0 ]; then echo "✓ Banco de dados inicializado"; fi

echo -e "\n[3] Próximas etapas:"
echo "   - Subir Kafka: cd infrastructure/kafka && docker compose up -d"
echo "   - Terminal 1 (Extract):   ./scripts/run_extract.sh"
echo "   - Terminal 2 (Transform): ./scripts/run_transform.sh"
echo "   - Terminal 3 (Load):      ./scripts/run_load.sh"
echo -e "\n✓ Setup concluído!"
