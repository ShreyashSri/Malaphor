from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import json
import time
from datetime import datetime
import asyncio
import logging

from backend.inference.inference import CloudSecurityInference
from backend.data.graph_dataset import CloudSecurityGraphGenerator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('malaphor.log')
    ]
)

logger = logging.getLogger('malaphor')

# Initialize FastAPI app
app = FastAPI(
    title="Malaphor API",
    description="AI-Enhanced Threat Hunting for Cloud Environments",
    version="0.1.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

class Graph(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

class AffectedResource(BaseModel):
    id: str
    name: str
    type: str

class Anomaly(BaseModel):
    id: str
    title: str
    description: str
    severity: str
    timestamp: str
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

class AnalysisRequest(BaseModel):
    graph: Graph

class AnalysisResponse(BaseModel):
    anomalies: List[Anomaly]
    metrics: Metrics

# Global variables
MODEL_PATH = os.environ.get('MODEL_PATH', './output/best_model.pt')
inference_engine = None
cloud_graph = None
anomalies = []
metrics = {
    'total_resources': 0,
    'risk_score': 0,
    'anomalies_detected': 0,
    'critical_alerts': 0
}
analysis_in_progress = False
model_required = False  # Flag to indicate if model is required for operation

# Dependency to get inference engine
def get_inference_engine():
    global inference_engine, model_required
    if inference_engine is None and model_required:
        try:
            inference_engine = CloudSecurityInference(MODEL_PATH)
            logger.info(f"Loaded model from {MODEL_PATH}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")
    return inference_engine

# Background task for analysis
async def analyze_cloud_graph(graph: Dict[str, Any], inference_engine: CloudSecurityInference):
    global anomalies, metrics, analysis_in_progress
    
    try:
        analysis_in_progress = True
        logger.info(f"Starting analysis of graph with {len(graph['nodes'])} nodes and {len(graph['edges'])} edges")
        
        # Detect anomalies
        detected_anomalies = inference_engine.detect_anomalies(graph, threshold=0.7)
        
        # Process anomalies
        processed_anomalies = []
        for anomaly in detected_anomalies:
            # Get affected resources
            affected_resources = []
            for node_id in [anomaly['node_id']] + anomaly['connected_nodes']:
                node = next((n for n in graph['nodes'] if n['id'] == node_id), None)
                if node:
                    affected_resources.append({
                        'id': node['id'],
                        'name': node.get('label', node['id']),
                        'type': node.get('group', 'unknown')
                    })
            
            # Create processed anomaly
            processed_anomaly = {
                'id': anomaly['id'],
                'title': f"Anomalous {anomaly['node_type']} detected",
                'description': f"Unusual behavior detected for {anomaly['node_label']}",
                'severity': anomaly['severity'],
                'timestamp': anomaly['timestamp'],
                'resource_ids': [anomaly['node_id']],
                'resource_type': anomaly['node_type'],
                'affected_resources': affected_resources,
                'detection_method': "Graph Neural Network analysis detected unusual patterns in the resource relationships",
                'suggested_action': f"Investigate the {anomaly['node_type']} resource and its connections for potential security issues",
                'is_new': True
            }
            
            processed_anomalies.append(processed_anomaly)
        
        # Update global variables
        anomalies = processed_anomalies
        
        # Update metrics
        metrics['total_resources'] = len(graph['nodes'])
        metrics['anomalies_detected'] = len(anomalies)
        metrics['critical_alerts'] = sum(1 for a in anomalies if a['severity'] == 'critical')
        
        # Calculate risk score (0-100)
        if anomalies:
            severity_weights = {'critical': 100, 'high': 70, 'medium': 40, 'low': 10}
            weighted_sum = sum(severity_weights[a['severity']] for a in anomalies)
            metrics['risk_score'] = min(100, int(weighted_sum / len(anomalies)))
        else:
            metrics['risk_score'] = 0
        
        logger.info(f"Analysis complete. Found {len(anomalies)} anomalies.")
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
    finally:
        analysis_in_progress = False

# Routes
@app.get("/")
async def root():
    return {
        "message": "Malaphor API is running",
        "version": "0.1.0",
        "endpoints": [
            {"path": "/api/graph", "method": "GET", "description": "Get the cloud resource graph"},
            {"path": "/api/anomalies", "method": "GET", "description": "Get detected anomalies"},
            {"path": "/api/metrics", "method": "GET", "description": "Get system metrics"},
            {"path": "/api/analyze", "method": "POST", "description": "Analyze a cloud graph"}
        ]
    }

@app.get("/api/graph")
async def get_cloud_graph():
    global cloud_graph
    
    if cloud_graph is None:
        # Generate a sample graph if none exists
        generator = CloudSecurityGraphGenerator()
        cloud_graph = generator.generate_graph(num_nodes=25, edge_probability=0.1, anomaly_probability=0.5)
    
    return cloud_graph

@app.get("/api/anomalies")
async def get_anomalies():
    global anomalies
    return anomalies

@app.get("/api/metrics")
async def get_metrics():
    global metrics
    return metrics

@app.post("/api/analyze")
async def analyze(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks,
    inference_engine: CloudSecurityInference = Depends(get_inference_engine)
):
    global cloud_graph, analysis_in_progress
    
    if analysis_in_progress:
        return {"message": "Analysis already in progress"}
    
    # Update cloud graph
    cloud_graph = request.graph.dict()
    
    # Start analysis in background
    background_tasks.add_task(analyze_cloud_graph, cloud_graph, inference_engine)
    
    return {"message": "Analysis started"}

@app.get("/api/status")
async def get_status():
    global analysis_in_progress
    return {"analysis_in_progress": analysis_in_progress}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        return {
            "status": "healthy",
            "message": "API is running",
            "timestamp": datetime.now().isoformat(),
            "model_status": {
                "required": model_required,
                "loaded": inference_engine is not None,
                "path": MODEL_PATH
            },
            "features": {
                "graph_generation": True,
                "anomaly_detection": model_required and inference_engine is not None
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "degraded",
            "message": str(e),
            "timestamp": datetime.now().isoformat(),
            "model_status": {
                "required": model_required,
                "loaded": inference_engine is not None,
                "path": MODEL_PATH
            }
        }

# Startup event
@app.on_event("startup")
async def startup_event():
    # Try to load model but don't fail if it's not available
    try:
        get_inference_engine()
    except Exception as e:
        logger.warning(f"Could not load model at startup: {e}")
    
    # Generate initial graph
    generator = CloudSecurityGraphGenerator()
    global cloud_graph
    cloud_graph = generator.generate_graph(num_nodes=25, edge_probability=0.1, anomaly_probability=0.5)
    
    # Run initial analysis only if model is loaded
    if inference_engine is not None:
        try:
            await analyze_cloud_graph(cloud_graph, inference_engine)
        except Exception as e:
            logger.warning(f"Initial analysis failed: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
