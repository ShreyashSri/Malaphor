# FastAPI backend code that would be deployed separately
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import torch
import torch_geometric
from datetime import datetime, timedelta
import random
import json

app = FastAPI(title="Malaphor API", description="AI-Enhanced Threat Hunting for Cloud Environments")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data storage
# In production, this would use Neo4j or another graph database
cloud_graph = {
    "nodes": [],
    "edges": []
}

anomalies = []

# Models
class Node(BaseModel):
    id: str
    label: str
    group: Optional[str] = None

class Edge(BaseModel):
    id: str
    from_id: str
    to_id: str
    label: Optional[str] = None

class AffectedResource(BaseModel):
    id: str
    name: str
    type: str

class Anomaly(BaseModel):
    id: str
    title: str
    description: str
    severity: str
    timestamp: datetime
    resource_ids: List[str]
    resource_type: str
    affected_resources: List[AffectedResource]
    detection_method: str
    suggested_action: str
    is_new: Optional[bool] = False

class Metrics(BaseModel):
    total_resources: int
    risk_score: int
    anomalies_detected: int
    critical_alerts: int

# Mock GNN model class
class CloudGNN:
    def __init__(self):
        # In a real implementation, this would load a trained PyTorch Geometric model
        print("Initializing Cloud GNN model")
        
    def process_graph(self, nodes, edges):
        # This would convert the graph data to PyTorch Geometric format and run inference
        print(f"Processing graph with {len(nodes)} nodes and {len(edges)} edges")
        return {
            "risk_score": 68,
            "anomalies": [
                {
                    "id": "anomaly-1",
                    "title": "Excessive Cross-VPC Connectivity",
                    "description": "Multiple instances in production have established connections to development environment resources.",
                    "severity": "high",
                    "resource_ids": ["vm-5", "subnet-3"],
                    "resource_type": "Network Connectivity",
                    "affected_resources": [
                        {"id": "vm-5", "name": "Admin Instance", "type": "VM Instance"},
                        {"id": "subnet-3", "name": "Dev Subnet", "type": "Subnet"}
                    ],
                    "detection_method": "GNN-based pattern analysis detected unusual cross-environment connectivity that deviates from normal operational patterns.",
                    "suggested_action": "Review and enforce network segmentation between production and development environments. Update firewall rules to restrict unnecessary cross-VPC traffic."
                },
                # Additional mock anomalies would be here
            ]
        }

# Initialize the GNN model
model = CloudGNN()

# Load mock data (in production, this would be connected to cloud provider APIs)
@app.on_event("startup")
async def startup_event():
    # Load example data
    with open("mock_data/cloud_graph.json", "r") as f:
        global cloud_graph
        cloud_graph = json.load(f)
    
    # Run initial analysis
    analyze_cloud_environment()

def analyze_cloud_environment():
    """Run the GNN model on the current cloud graph"""
    global anomalies
    
    # In production, this would be actual GNN inference
    analysis_result = model.process_graph(cloud_graph["nodes"], cloud_graph["edges"])
    
    # Process anomalies
    anomalies = []
    for anomaly_data in analysis_result["anomalies"]:
        anomalies.append(
            Anomaly(
                id=anomaly_data["id"],
                title=anomaly_data["title"],
                description=anomaly_data["description"],
                severity=anomaly_data["severity"],
                timestamp=datetime.now() - timedelta(minutes=random.randint(0, 300)),
                resource_ids=anomaly_data["resource_ids"],
                resource_type=anomaly_data["resource_type"],
                affected_resources=anomaly_data["affected_resources"],
                detection_method=anomaly_data["detection_method"],
                suggested_action=anomaly_data["suggested_action"],
                is_new=True
            )
        )

# API Routes
@app.get("/api/graph")
async def get_cloud_graph():
    return cloud_graph

@app.get("/api/anomalies")
async def get_anomalies():
    return anomalies

@app.get("/api/metrics")
async def get_metrics():
    return Metrics(
        total_resources=len(cloud_graph["nodes"]),
        risk_score=68,  # In production, this would be calculated
        anomalies_detected=len(anomalies),
        critical_alerts=sum(1 for a in anomalies if a.severity == "critical")
    )

@app.post("/api/analyze")
async def run_analysis():
    analyze_cloud_environment()
    return {"message": "Analysis complete", "anomalies_found": len(anomalies)}

# For demonstration purposes - would be removed in production
@app.get("/")
async def root():
    return {
        "message": "Malaphor API is running",
        "endpoints": [
            {"path": "/api/graph", "method": "GET", "description": "Get the cloud resource graph"},
            {"path": "/api/anomalies", "method": "GET", "description": "Get detected anomalies"},
            {"path": "/api/metrics", "method": "GET", "description": "Get system metrics"},
            {"path": "/api/analyze", "method": "POST", "description": "Trigger a new analysis"}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
