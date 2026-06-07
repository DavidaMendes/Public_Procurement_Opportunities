#!/bin/bash
# Transform Worker
cd "$(dirname "$0")"
PYTHONPATH=. python app/workers/transform_worker.py "$@"
