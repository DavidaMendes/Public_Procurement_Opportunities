#!/bin/bash
# Extract Worker - Usa RECIFE_PROCUREMENT como padrão
cd "$(dirname "$0")/.."
PYTHONPATH=. python app/workers/extract_worker.py "$@"
