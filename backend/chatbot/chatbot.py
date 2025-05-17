import os
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from pydantic import BaseModel
import logging

logger = logging.getLogger('malaphor')

class ChatEntry(BaseModel):
    role: str
    text: str

class ChatbotConfig(BaseModel):
    api_key: str
    model_name: str = "gemini-1.5-flash"
    temperature: float = 0.7

SYSTEM_PROMPT = """
You are a helpful and professional chatbot for Malaphor - AI-Enhanced Threat Hunting for Cloud Environments.
Your primary role is to assist users with the analysis of cloud access logs and security findings.
If the user asks anything unrelated to Malaphor or its functionalities, respond with:
"This chatbot is designed to assist only with Malaphor features and related queries. Please keep your questions focused on the platform."

Always keep responses clear, accurate, and limited to Malaphor content only.
"""

class Chatbot:
    def __init__(self, config: ChatbotConfig):
        self.config = config
        genai.configure(api_key=config.api_key)
        self.model = genai.GenerativeModel(config.model_name)
        
    def _format_history(self, chat_history: List[ChatEntry]) -> List[Dict[str, Any]]:
        """Format chat history for Gemini API."""
        formatted_history = []
        
        for entry in chat_history:
            if entry.role in ["user", "model"]:
                formatted_history.append({
                    "role": entry.role,
                    "parts": [{"text": entry.text}]
                })
        
        if not formatted_history or formatted_history[0]["role"] != "user":
            formatted_history.insert(0, {
                "role": "user",
                "parts": [{"text": "Hello!"}]
            })
            
        return formatted_history
    
    async def chat(self, user_input: str, chat_history: List[ChatEntry]) -> str:
        """Process a chat message and return the response."""
        try:
            formatted_history = self._format_history(chat_history)
            
            chat = self.model.start_chat(
                history=formatted_history,
                generation_config={
                    "temperature": self.config.temperature
                },
                system_instruction={
                    "role": "system",
                    "parts": [{"text": SYSTEM_PROMPT}]
                }
            )
            
            response = await chat.send_message(user_input)
            return response.text or "Sorry, I didn't understand that."
            
        except Exception as e:
            logger.error(f"Chat error: {str(e)}")
            return "Sorry, I am experiencing technical issues. Please try again later."

def get_chatbot() -> Chatbot:
    """Get or create a chatbot instance."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set")
        
    config = ChatbotConfig(api_key=api_key)
    return Chatbot(config) 