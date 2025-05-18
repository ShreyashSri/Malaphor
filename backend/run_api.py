import uvicorn
from api.server import app

if __name__ == "__main__":
    uvicorn.run(
        "api.server:app",
        host="127.0.0.1",
        port=3001,
        reload=True,
        reload_dirs=["backend"]
    ) 