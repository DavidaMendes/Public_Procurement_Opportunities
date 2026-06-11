# Extract Worker - Usa RECIFE_PROCUREMENT como padrão
$env:PYTHONPATH = "."
& python app/workers/extract_worker.py @args
