import os
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from pydantic import BaseModel
import logging
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger('malaphor')

class ChatBot:
    def __init__(self):
        # Initialize Gemini API
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        self.chat = self.model.start_chat(history=[])
        
    async def chat(self, message: str, history: List[Dict[str, str]]) -> str:
        """
        Process a chat message and return a response.
        
        Args:
            message: The user's message
            history: List of previous messages in the format [{"role": "user/assistant", "content": "message"}]
            
        Returns:
            The assistant's response
        """
        try:
            # Add context about the system's capabilities
            context = """You are a security analysis assistant for the Malaphor platform. 
            You help users understand their cloud security logs and provide insights about potential security issues.
            Focus on:
            1. Explaining security findings in simple terms
            2. Providing actionable recommendations
            3. Helping users understand their log data
            4. Identifying patterns and anomalies in security logs
            """
            
            # Format the conversation history
            formatted_history = []
            for msg in history:
                role = "user" if msg["role"] == "user" else "model"
                formatted_history.append({"role": role, "parts": [msg["content"]]})
            
            # Add the current message
            formatted_history.append({"role": "user", "parts": [message]})
            
            # Generate response
            response = await self.model.generate_content(
                contents=formatted_history,
                generation_config={
                    "temperature": 0.7,
                    "top_p": 0.8,
                    "top_k": 40,
                }
            )
            
            return response.text
            
        except Exception as e:
            logger.error(f"Chat error: {str(e)}")
            return f"I apologize, but I encountered an error: {str(e)}. Please try again."

# Create a singleton instance
_chatbot_instance = None

def get_chatbot() -> ChatBot:
    """Get or create the chatbot instance."""
    global _chatbot_instance
    if _chatbot_instance is None:
        _chatbot_instance = ChatBot()
    return _chatbot_instance 