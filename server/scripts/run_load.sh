cd "$(dirname "$0")/.."
PYTHONPATH=. python app/workers/load_worker.py "$@"
