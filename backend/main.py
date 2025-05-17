from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import logging
from datetime import datetime
import uuid
from typing import List, Dict, Optional
import uvicorn
import argparse
from fastapi.responses import JSONResponse

from config import get_settings, Settings
from models.schemas import (
    Graph, AnalysisRequest, AnalysisResponse, ErrorResponse,
    Anomaly, Metrics, Node, Edge
)
from integration.cloud_providers import get_cloud_provider
from inference.inference import CloudSecurityInference
from repositories.graph import GraphRepository

# Enhanced logging configuration
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
    title="Malaphor Security Analysis API",
    description="AI-Enhanced Threat Hunting for Cloud Environments",
    version="0.1.0"
)

# Enable CORS with more specific configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Update with specific origins for production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Global variables
inference_engine = None
analysis_results = {}

class AWSConfig(BaseModel):
    aws_access_key_id: str
    aws_secret_access_key: str
    region_name: Optional[str] = "us-east-1"
# Enhanced error handling middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.utcnow()
    try:
        response = await call_next(request)
        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()
        logger.info(
            "request_processed",
            extra={
                "path": request.url.path,
                "method": request.method,
                "duration": duration,
                "status_code": response.status_code
            }
        )
        return response
    except Exception as e:
        logger.error(
            "request_failed",
            extra={
                "path": request.url.path,
                "method": request.method,
                "error": str(e)
            },
            exc_info=True
        )
        raise

# Enhanced exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    settings = get_settings()
    if settings.DEBUG:
        detail = str(exc)
    else:
        detail = "An internal server error occurred"
    
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal Server Error",
            detail=detail,
            code=500
        ).dict()
    )

# Health Check
@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "malaphor-security-api"}

@app.get("/health")
async def health_check_redirect():
    """Redirect /health to /api/health for backward compatibility."""
    return RedirectResponse(url="/api/health")

# Mock data for development and testing
MOCK_NODES: List[Node] = [
    {"id": "vpc-1", "label": "Main VPC", "group": "network"},
    {"id": "vpc-2", "label": "Development VPC", "group": "network"},
    {"id": "subnet-1", "label": "Public Subnet", "group": "network"},
    {"id": "subnet-2", "label": "Private Subnet", "group": "network"},
    {"id": "subnet-3", "label": "Dev Subnet", "group": "network"},
    {"id": "vm-1", "label": "Web Server", "group": "compute"},
    {"id": "vm-2", "label": "API Server", "group": "compute"},
    {"id": "vm-3", "label": "Database Server", "group": "compute"},
    {"id": "vm-4", "label": "Dev Instance", "group": "compute"},
    {"id": "vm-5", "label": "Admin Instance", "group": "compute"},
    {"id": "vm-6", "label": "Worker Node", "group": "compute"},
    {"id": "storage-1", "label": "User Data Bucket", "group": "storage"},
    {"id": "storage-2", "label": "Logs Bucket", "group": "storage"},
    {"id": "storage-3", "label": "Backup Bucket", "group": "storage"},
    {"id": "db-1", "label": "Primary Database", "group": "storage"},
    {"id": "db-2", "label": "Replica Database", "group": "storage"},
    {"id": "cache-1", "label": "Redis Cache", "group": "storage"},
    {"id": "sa-1", "label": "Admin Service Account", "group": "identity"},
    {"id": "sa-2", "label": "App Service Account", "group": "identity"},
    {"id": "sa-3", "label": "Backup Service Account", "group": "identity"},
    {"id": "role-1", "label": "Admin Role", "group": "identity"},
    {"id": "role-2", "label": "Developer Role", "group": "identity"},
    {"id": "role-3", "label": "Viewer Role", "group": "identity"},
    {"id": "user-1", "label": "Admin User", "group": "identity"},
    {"id": "user-2", "label": "Developer User", "group": "identity"}
]

MOCK_EDGES: List[Edge] = [
    {"id": "e1", "from": "vpc-1", "to": "subnet-1"},
    {"id": "e2", "from": "vpc-1", "to": "subnet-2"},
    {"id": "e3", "from": "vpc-2", "to": "subnet-3"},
    {"id": "e4", "from": "subnet-1", "to": "vm-1"},
    {"id": "e5", "from": "subnet-1", "to": "vm-2"},
    {"id": "e6", "from": "subnet-2", "to": "vm-3"},
    {"id": "e7", "from": "subnet-2", "to": "vm-6"},
    {"id": "e8", "from": "subnet-3", "to": "vm-4"},
    {"id": "e9", "from": "subnet-3", "to": "vm-5"},
    {"id": "e10", "from": "vm-1", "to": "storage-1", "label": "read/write"},
    {"id": "e11", "from": "vm-2", "to": "storage-1", "label": "read/write"},
    {"id": "e12", "from": "vm-2", "to": "db-1", "label": "read/write"},
    {"id": "e13", "from": "vm-3", "to": "db-1", "label": "admin"},
    {"id": "e14", "from": "vm-3", "to": "db-2", "label": "admin"},
    {"id": "e15", "from": "vm-3", "to": "storage-2", "label": "write"},
    {"id": "e16", "from": "vm-4", "to": "storage-3", "label": "read/write"},
    {"id": "e17", "from": "vm-5", "to": "storage-1", "label": "read/write"},
    {"id": "e18", "from": "vm-6", "to": "cache-1", "label": "read/write"},
    {"id": "e19", "from": "vm-1", "to": "cache-1", "label": "read"},
    {"id": "e20", "from": "vm-2", "to": "cache-1", "label": "read/write"},
    {"id": "e21", "from": "sa-1", "to": "role-1", "label": "has"},
    {"id": "e22", "from": "sa-2", "to": "role-2", "label": "has"},
    {"id": "e23", "from": "sa-3", "to": "role-3", "label": "has"},
    {"id": "e24", "from": "user-1", "to": "role-1", "label": "has"},
    {"id": "e25", "from": "user-2", "to": "role-2", "label": "has"},
    {"id": "e26", "from": "role-1", "to": "vm-5", "label": "admin"},
    {"id": "e27", "from": "role-1", "to": "storage-1", "label": "admin"},
    {"id": "e28", "from": "role-1", "to": "storage-2", "label": "admin"},
    {"id": "e29", "from": "role-1", "to": "storage-3", "label": "admin"},
    {"id": "e30", "from": "role-2", "to": "vm-4", "label": "admin"},
    {"id": "e31", "from": "role-2", "to": "storage-3", "label": "read/write"},
    {"id": "e32", "from": "role-3", "to": "storage-1", "label": "read"},
    {"id": "e33", "from": "role-3", "to": "storage-2", "label": "read"},
    {"id": "e34", "from": "vm-4", "to": "db-1", "label": "read"},
    {"id": "e35", "from": "sa-2", "to": "storage-2", "label": "read"},
    {"id": "e36", "from": "vm-5", "to": "subnet-3", "label": "connect"},
    {"id": "e37", "from": "sa-3", "to": "role-1", "label": "has"}
]

MOCK_ANOMALIES: List[Dict] = [
    {
        "id": "anomaly-1",
        "title": "Excessive Cross-VPC Connectivity",
        "description": "Multiple instances in production have established connections to development environment resources.",
        "severity": "high",
        "timestamp": "2025-05-16T14:30:00Z",
        "resourceIds": ["vm-5", "subnet-3"],
        "resourceType": "Network Connectivity",
        "affectedResources": [
            {"id": "vm-5", "name": "Admin Instance", "type": "VM Instance"},
            {"id": "subnet-3", "name": "Dev Subnet", "type": "Subnet"}
        ],
        "detectionMethod": "GNN-based pattern analysis detected unusual cross-environment connectivity that deviates from normal operational patterns.",
        "suggestedAction": "Review and enforce network segmentation between production and development environments. Update firewall rules to restrict unnecessary cross-VPC traffic.",
        "isNew": True
    },
    {
        "id": "anomaly-2",
        "title": "Privilege Escalation Path Detected",
        "description": "A service account with minimal permissions has an indirect path to obtain administrative access.",
        "severity": "critical",
        "timestamp": "2025-05-16T13:45:00Z",
        "resourceIds": ["sa-3", "role-1"],
        "resourceType": "Identity & Access Management",
        "affectedResources": [
            {"id": "sa-3", "name": "Backup Service Account", "type": "Service Account"},
            {"id": "role-1", "name": "Admin Role", "type": "IAM Role"}
        ],
        "detectionMethod": "Graph path analysis identified a privilege escalation route through role inheritance that circumvents normal permission boundaries.",
        "suggestedAction": "Immediately remove the unexpected role binding between the backup service account and admin role. Review all service account permissions for the principle of least privilege.",
        "isNew": True
    },
    {
        "id": "anomaly-3",
        "title": "Unauthorized Database Access",
        "description": "Development instance accessed production database which is outside its normal operational pattern.",
        "severity": "critical",
        "timestamp": "2025-05-16T12:15:00Z",
        "resourceIds": ["vm-4", "db-1"],
        "resourceType": "Database Access",
        "affectedResources": [
            {"id": "vm-4", "name": "Dev Instance", "type": "VM Instance"},
            {"id": "db-1", "name": "Primary Database", "type": "Database"}
        ],
        "detectionMethod": "GNN anomaly detection identified unusual access patterns between development resources and production data stores.",
        "suggestedAction": "Immediately revoke database access from development instances. Investigate why and how this access was granted. Implement database access monitoring."
    }
]

MOCK_METRICS = {
    "totalResources": 25,
    "riskScore": 68,
    "anomaliesDetected": 5,
    "criticalAlerts": 2
}

def get_inference_engine(settings: Settings = Depends(get_settings)) -> CloudSecurityInference:
    """Get or initialize the inference engine"""
    global inference_engine
    if inference_engine is None:
        try:
            inference_engine = CloudSecurityInference(
                model_path=settings.MODEL_PATH,
                threshold=settings.MODEL_THRESHOLD
            )
            logger.info(f"Loaded model from {settings.MODEL_PATH}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to load model: {str(e)}"
            )
    return inference_engine

async def analyze_cloud_graph(
    request: AnalysisRequest,
    inference_engine: CloudSecurityInference,
    settings: Settings
) -> AnalysisResponse:
    """Analyze cloud resource graph for anomalies"""
    try:
        # For now, we're using dummy data instead of actual AWS integration
        graph = {
            'nodes': MOCK_NODES,  # Using our mock data
            'edges': MOCK_EDGES   # Using our mock data
        }

        # Detect anomalies (using mock data for now)
        anomalies = MOCK_ANOMALIES

        # Calculate metrics (using mock data for now)
        metrics = Metrics(
            totalResources=MOCK_METRICS["totalResources"],
            riskScore=MOCK_METRICS["riskScore"],
            anomaliesDetected=MOCK_METRICS["anomaliesDetected"],
            criticalAlerts=MOCK_METRICS["criticalAlerts"]
        )

        # Create response
        analysis_id = str(uuid.uuid4())
        response = AnalysisResponse(
            anomalies=anomalies,
            metrics=metrics,
            analysis_id=analysis_id,
            timestamp=datetime.utcnow(),
            status="completed"
        )

        # Store results
        analysis_results[analysis_id] = response

        return response

    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

# Dependency injection
def get_graph_repository(settings: Settings = Depends(get_settings)) -> GraphRepository:
    """Get graph repository instance."""
    return GraphRepository(settings)

# Routes
@app.get("/")
async def root():
    return {
        "message": "Malaphor API is running",
        "version": "0.1.0",
        "endpoints": [
            {"path": "/api/graph", "method": "GET", "description": "Get cloud infrastructure graph data"},
            {"path": "/api/anomalies", "method": "GET", "description": "Get detected anomalies"},
            {"path": "/api/metrics", "method": "GET", "description": "Get system metrics"},
            {"path": "/api/analyze", "method": "POST", "description": "Analyze cloud resources"},
            {"path": "/api/analysis/{analysis_id}", "method": "GET", "description": "Get analysis results"}
        ]
    }

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

@app.get("/api/analysis/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(analysis_id: str):
    """Get analysis results by ID"""
    if analysis_id not in analysis_results:
        raise HTTPException(
            status_code=404,
            detail=f"Analysis {analysis_id} not found"
        )
    return analysis_results[analysis_id]

@app.get("/api/graph", response_model=Graph)
async def get_cloud_graph(
    repo: GraphRepository = Depends(get_graph_repository)
):
    """Get the cloud infrastructure graph data"""
    try:
        return await repo.get_cloud_graph()
    except Exception as e:
        logger.error(f"Failed to get cloud graph: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get cloud graph: {str(e)}"
        )

@app.get("/api/anomalies")
async def get_anomalies():
    """Get detected anomalies"""
    try:
        return MOCK_ANOMALIES
    except Exception as e:
        logger.error(f"Failed to get anomalies: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get anomalies: {str(e)}"
        )

@app.get("/api/metrics")
async def get_metrics():
    """Get system metrics"""
    try:
        return MOCK_METRICS
    except Exception as e:
        logger.error(f"Failed to get metrics: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get metrics: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run(
        app,
        host=settings.API_HOST,
        port=settings.API_PORT,
        log_level="debug" if settings.DEBUG else "info"
    )
