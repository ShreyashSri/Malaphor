# FastAPI backend code that would be deployed separately
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
import logging
from datetime import datetime
import uuid

from backend.config import get_settings, Settings
from backend.models.schemas import (
    Graph, AnalysisRequest, AnalysisResponse, ErrorResponse,
    Anomaly, Metrics
)
from backend.integration.cloud_providers import AWSProvider
from backend.inference.inference import CloudSecurityInference

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
    description="AI-Enhanced Threat Hunting for AWS Cloud Environments",
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

# Global variables
inference_engine = None
aws_provider = None
analysis_results = {}

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

def get_aws_provider(settings: Settings = Depends(get_settings)) -> AWSProvider:
    """Get or initialize the AWS provider"""
    global aws_provider
    if aws_provider is None:
        try:
            aws_provider = AWSProvider(
                access_key=settings.AWS_ACCESS_KEY_ID,
                secret_key=settings.AWS_SECRET_ACCESS_KEY,
                region=settings.AWS_REGION
            )
            logger.info("Initialized AWS provider")
        except Exception as e:
            logger.error(f"Failed to initialize AWS provider: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to initialize AWS provider: {str(e)}"
            )
    return aws_provider

async def analyze_aws_resources(
    aws_provider: AWSProvider,
    inference_engine: CloudSecurityInference
) -> AnalysisResponse:
    """Analyze AWS resources for security anomalies"""
    try:
        # Get AWS resources and relationships
        resources = aws_provider.get_resources()
        relationships = aws_provider.get_resource_relationships()

        # Combine resources and relationships
        graph = {
            'nodes': resources['nodes'],
            'edges': resources['edges'] + relationships
        }

        # Detect anomalies
        anomalies = inference_engine.detect_anomalies(graph)

        # Calculate metrics
        metrics = Metrics(
            total_resources=len(graph['nodes']),
            risk_score=min(100, int(sum(1 for a in anomalies if a['severity'] in ['critical', 'high']) * 20)),
            anomalies_detected=len(anomalies),
            critical_alerts=sum(1 for a in anomalies if a['severity'] == 'critical'),
            high_risk_alerts=sum(1 for a in anomalies if a['severity'] == 'high'),
            medium_risk_alerts=sum(1 for a in anomalies if a['severity'] == 'medium'),
            low_risk_alerts=sum(1 for a in anomalies if a['severity'] == 'low')
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

# Routes
@app.get("/")
async def root():
    return {
        "message": "Malaphor API is running",
        "version": "0.1.0",
        "endpoints": [
            {"path": "/api/analyze", "method": "POST", "description": "Analyze AWS resources"},
            {"path": "/api/analysis/{analysis_id}", "method": "GET", "description": "Get analysis results"},
            {"path": "/api/resources", "method": "GET", "description": "Get AWS resources"}
        ]
    }

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze(
    background_tasks: BackgroundTasks,
    aws_provider: AWSProvider = Depends(get_aws_provider),
    inference_engine: CloudSecurityInference = Depends(get_inference_engine)
):
    """Analyze AWS resources for security anomalies"""
    try:
        return await analyze_aws_resources(aws_provider, inference_engine)
    except Exception as e:
        logger.error(f"Analysis request failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.get("/api/analysis/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(analysis_id: str):
    """Get analysis results by ID"""
    if analysis_id not in analysis_results:
        raise HTTPException(
            status_code=404,
            detail=f"Analysis {analysis_id} not found"
        )
    return analysis_results[analysis_id]

@app.get("/api/resources")
async def get_resources(aws_provider: AWSProvider = Depends(get_aws_provider)):
    """Get all AWS resources"""
    try:
        resources = aws_provider.get_resources()
        relationships = aws_provider.get_resource_relationships()
        return {
            'resources': resources,
            'relationships': relationships
        }
    except Exception as e:
        logger.error(f"Failed to get AWS resources: {e}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return ErrorResponse(
        error="Internal Server Error",
        detail=str(exc),
        code=500
    )

if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run(
        app,
        host=settings.API_HOST,
        port=settings.API_PORT,
        debug=settings.DEBUG
    )
