from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os
from security.aws_client import AWSClient
from security.storage_analyzer import StorageAnalyzer
from security.network_analyzer import NetworkAnalyzer
from security.iam_analyzer import IAMAnalyzer

app = FastAPI(title="Malaphor Security Analysis API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AWSConfig(BaseModel):
    aws_access_key_id: str
    aws_secret_access_key: str
    region_name: Optional[str] = "us-east-1"

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "malaphor-security-api"}

@app.post("/api/analyze")
async def analyze_cloud_security(config: AWSConfig):
    """Analyze cloud security using AWS credentials."""
    try:
        # Initialize AWS client
        aws_client = AWSClient(
            aws_access_key_id=config.aws_access_key_id,
            aws_secret_access_key=config.aws_secret_access_key,
            region_name=config.region_name
        )
        
        # Get cloud graph data
        graph_data = aws_client.get_cloud_graph_data()
        
        # Initialize analyzers
        storage_analyzer = StorageAnalyzer()
        network_analyzer = NetworkAnalyzer()
        iam_analyzer = IAMAnalyzer()
        
        # Run analysis
        findings = {
            "storage": storage_analyzer.analyze(graph_data),
            "network": network_analyzer.analyze(graph_data),
            "iam": iam_analyzer.analyze(graph_data)
        }
        
        return {
            "status": "success",
            "findings": findings,
            "total_findings": sum(len(f) for f in findings.values())
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 