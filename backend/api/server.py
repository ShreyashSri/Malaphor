from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import json
import logging
from security.cloudtrail_parser import CloudTrailParser
from chatbot.chatbot import get_chatbot

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]]

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        logger.debug(f"Received chat request: {request.message}")
        chatbot = get_chatbot()
        response = await chatbot.get_response(request.message, request.history)
        logger.debug(f"Generated response: {response}")
        return {"response": response}
    except Exception as e:
        logger.error(f"Chat error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": str(e),
                "type": type(e).__name__,
                "message": "Failed to process chat request"
            }
        )

@app.post("/api/analyze-logs")
async def analyze_logs_file(file: UploadFile = File(...)):
    try:
        # Read the file content
        content = await file.read()
        
        # Parse the content as JSON
        try:
            logs = json.loads(content)
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=400, detail="Invalid JSON format")
        
        # Parse and analyze the logs using CloudTrailParser
        parser = CloudTrailParser()
        parsed_data = parser.parse(logs)
        analysis_results = parser.analyze(parsed_data)
        
        # Return both parsed data and analysis results
        return {
            "parsed_data": parsed_data,
            "analysis": analysis_results
        }
    except Exception as e:
        logger.error(f"Error analyzing logs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 