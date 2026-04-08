from fastapi import FastAPI
from app.core.database import client

app = FastAPI(
    title="Public Procurement API",
    version="1.0.0",
    description="API para consultar oportunidades de contratações públicas"
)

@app.get("/")
def read_root():
    return {
        "message": "API de Contratações Públicas ativa!",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/db-status")
def db_status():
    try:
        client.admin.command('ping')
        return {"database": "connected", "status": "ok"}
    except Exception as e:
        return {"database": "disconnected", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
