from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import os
import json
from security.aws_client import AWSClient
from security.storage_analyzer import StorageAnalyzer
from security.network_analyzer import NetworkAnalyzer
from security.iam_analyzer import IAMAnalyzer
from security.cloudtrail_parser import CloudTrailParser
from chatbot.chatbot import get_chatbot
from datetime import datetime

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

class LogAnalysisRequest(BaseModel):
    """Request model for log analysis."""
    logs: Dict[str, Any]

class ChatRequest(BaseModel):
    """Request model for chat messages."""
    message: str
    history: List[Dict[str, str]]

class ChatResponse(BaseModel):
    """Response model for chat messages."""
    response: str
    timestamp: datetime

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

@app.post("/api/analyze/logs")
async def analyze_logs(logs: LogAnalysisRequest):
    """Analyze security logs uploaded by the user."""
    try:
        # Parse CloudTrail logs
        parser = CloudTrailParser()
        parsed_data = parser.parse(logs.logs)
        
        # Initialize analyzers
        storage_analyzer = StorageAnalyzer()
        network_analyzer = NetworkAnalyzer()
        iam_analyzer = IAMAnalyzer()
        
        # Run analysis
        findings = {
            "storage": storage_analyzer.analyze(parsed_data),
            "network": network_analyzer.analyze(parsed_data),
            "iam": iam_analyzer.analyze(parsed_data)
        }
        
        # Add CloudTrail specific findings
        findings["cloudtrail"] = analyze_cloudtrail_logs(logs.logs)
        
        return {
            "status": "success",
            "findings": findings,
            "total_findings": sum(len(f) for f in findings.values())
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze/logs/file")
async def analyze_logs_file(file: UploadFile = File(...)):
    """Analyze security logs from an uploaded JSON file."""
    try:
        # Read and parse the uploaded file
        content = await file.read()
        try:
            logs = json.loads(content.decode('utf-8'))
        except json.JSONDecodeError as e:
            return JSONResponse(
                status_code=400,
                content={"detail": f"Invalid JSON format: {str(e)}"}
            )
            
        # Parse CloudTrail logs
        parser = CloudTrailParser()
        try:
            parsed_data = parser.parse(logs)  # Pass the parsed JSON directly
        except Exception as e:
            return JSONResponse(
                status_code=400,
                content={"detail": f"Error parsing CloudTrail logs: {str(e)}"}
            )
        
        # Initialize analyzers
        storage_analyzer = StorageAnalyzer()
        network_analyzer = NetworkAnalyzer()
        iam_analyzer = IAMAnalyzer()
        
        # Run analysis
        findings = {
            "storage": storage_analyzer.analyze(parsed_data),
            "network": network_analyzer.analyze(parsed_data),
            "iam": iam_analyzer.analyze(parsed_data)
        }
        
        # Add CloudTrail specific findings
        findings["cloudtrail"] = analyze_cloudtrail_logs(logs)
        
        return {
            "status": "success",
            "findings": findings,
            "total_findings": sum(len(f) for f in findings.values())
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": f"Server error: {str(e)}"}
        )

def analyze_cloudtrail_logs(logs: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Analyze CloudTrail logs for security issues."""
    findings = []
    
    if "Records" not in logs:
        return findings
        
    for record in logs["Records"]:
        # Check for suspicious IP addresses
        if "sourceIPAddress" in record:
            ip = record["sourceIPAddress"]
            if ip.startswith("253."):  # Example: Check for suspicious IP range
                findings.append({
                    "resource_id": record.get("eventID", "unknown"),
                    "severity": "high",
                    "title": "Suspicious IP Address Detected",
                    "description": f"API call from suspicious IP address: {ip}",
                    "recommendation": "Investigate the source of this API call and consider blocking this IP if unauthorized.",
                    "evidence": {
                        "ip": ip,
                        "event": record["eventName"],
                        "time": record["eventTime"]
                    }
                })
        
        # Check for unusual API calls
        if record["eventName"] in ["CreateAccessKey", "DeleteAccessKey", "PutUserPolicy"]:
            findings.append({
                "resource_id": record.get("eventID", "unknown"),
                "severity": "medium",
                "title": "Sensitive IAM Action Detected",
                "description": f"Sensitive IAM action '{record['eventName']}' was performed",
                "recommendation": "Review this action and ensure it was authorized.",
                "evidence": {
                    "action": record["eventName"],
                    "user": record["userIdentity"].get("userName", "unknown"),
                    "time": record["eventTime"]
                }
            })
            
        # Check for cross-region API calls
        if record.get("awsRegion") != "us-east-1":  # Example: Check for non-default region
            findings.append({
                "resource_id": record.get("eventID", "unknown"),
                "severity": "low",
                "title": "Cross-Region API Call",
                "description": f"API call made to region {record['awsRegion']}",
                "recommendation": "Verify if cross-region access is necessary for this operation.",
                "evidence": {
                    "region": record["awsRegion"],
                    "event": record["eventName"],
                    "time": record["eventTime"]
                }
            })
    
    return findings

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Chat with the AI assistant about security findings and logs."""
    try:
        chatbot = get_chatbot()
        response = await chatbot.chat(request.message, request.history)
        
        return ChatResponse(
            response=response,
            timestamp=datetime.utcnow()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Chat error: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 