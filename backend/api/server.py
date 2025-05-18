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

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        chatbot = get_chatbot()
        response = await chatbot.chat(request.message, request.history)
        return {"response": response}
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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
        
        # Parse the logs using CloudTrailParser
        parser = CloudTrailParser()
        parsed_data = parser.parse(logs)
        
        return parsed_data
    except Exception as e:
        logger.error(f"Error analyzing logs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 