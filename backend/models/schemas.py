from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class Node(BaseModel):
    id: str
    label: str
    group: Optional[str] = None
    properties: Optional[Dict[str, Any]] = Field(default_factory=dict)

class Edge(BaseModel):
    id: str
    from_id: str
    to_id: str
    label: Optional[str] = None
    properties: Optional[Dict[str, Any]] = Field(default_factory=dict)

class Graph(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

class AffectedResource(BaseModel):
    id: str
    name: str
    type: str
    properties: Optional[Dict[str, Any]] = Field(default_factory=dict)

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
    is_new: bool = False
    confidence_score: float = Field(ge=0.0, le=1.0)

class Metrics(BaseModel):
    total_resources: int
    risk_score: int = Field(ge=0, le=100)
    anomalies_detected: int
    critical_alerts: int
    high_risk_alerts: int
    medium_risk_alerts: int
    low_risk_alerts: int

class AnalysisRequest(BaseModel):
    graph: Graph
    provider: str
    region: Optional[str] = None

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