from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class Node(BaseModel):
    id: str
    label: str
    group: Optional[str] = None

class Edge(BaseModel):
    id: str
    from_: str = Field(alias="from")  # Using alias since 'from' is a Python keyword
    to: str
    label: Optional[str] = None

class Graph(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

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
    resourceIds: List[str]
    resourceType: str
    affectedResources: List[AffectedResource]
    detectionMethod: str
    suggestedAction: str
    isNew: Optional[bool] = None

class Metrics(BaseModel):
    totalResources: int
    riskScore: int = Field(ge=0, le=100)
    anomaliesDetected: int
    criticalAlerts: int

class AnalysisRequest(BaseModel):
    graph: Graph
    region: Optional[str] = "us-west-2"  # Default AWS region

class AnalysisResponse(BaseModel):
    anomalies: List[Anomaly]
    metrics: Metrics
    analysis_id: str
    timestamp: datetime
    status: str

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    code: int 