import os
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from pydantic import BaseModel
import logging
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger('malaphor')

# System knowledge for the chatbot
MALAPHOR_KNOWLEDGE = """
You are a helpful and professional chatbot for Malaphor - AI-Enhanced Threat Hunting for Cloud Environments.
Your primary role is to assist users with the analysis of cloud access logs.
If the user asks anything unrelated to Malaphor or its functionalities, respond with:
"This chatbot is designed to assist only with Malaphor features and related queries. Please keep your questions focused on the platform."

Always keep responses clear, accurate, and limited to Malaphor content only.
"""

class ChatBot:
    def __init__(self):
        try:
            # Initialize Gemini API
            api_key = os.getenv('GEMINI_API_KEY')
            logger.debug(f"API Key found: {'Yes' if api_key else 'No'}")
            
            if not api_key:
                raise ValueError("GEMINI_API_KEY environment variable is not set")
            
            genai.configure(api_key=api_key)
            # Use the latest model
            self.model = genai.GenerativeModel('gemini-1.5-pro')
            logger.info("ChatBot initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing ChatBot: {str(e)}")
            raise
        
    async def get_response(self, message: str, history: List[Dict[str, str]]) -> str:
        """
        Process a chat message and return a response.
        
        Args:
            message: The user's message
            history: List of previous messages in the format [{"role": "user/assistant", "content": "message"}]
            
        Returns:
            The assistant's response
        """
        try:
            logger.debug(f"Processing message: {message}")
            logger.debug(f"History length: {len(history)}")
            
            # Format chat history: only user and model roles
            formatted_history = []
            for msg in history:
                if msg["role"] in ["user", "assistant"]:
                    role = "user" if msg["role"] == "user" else "model"
                    formatted_history.append({
                        "role": role,
                        "parts": [{"text": msg["content"]}]
                    })
            
            # Ensure there's at least one user message
            if not formatted_history or formatted_history[0]["role"] != "user":
                logger.warning("First message must be from user. Adding a dummy message.")
                formatted_history.insert(0, {
                    "role": "user",
                    "parts": [{"text": "Hello!"}]
                })
            
            logger.debug("Starting chat session")
            # Start chat session
            chat = self.model.start_chat(history=formatted_history)
            
            logger.debug("Sending message to chat")
            # Send message and get response
            response = await chat.send_message(
                f"{MALAPHOR_KNOWLEDGE}\n\nUser message: {message}",
                generation_config={
                    "temperature": 0.7,
                    "top_p": 0.8,
                    "top_k": 40,
                }
            )
            
            logger.debug(f"Received response from Gemini API: {response}")
            
            if not response:
                raise ValueError("No response received from model")
                
            if not response.text:
                raise ValueError("Empty text in response from model")
                
            return response.text
            
        except Exception as e:
            logger.error(f"Chat error: {str(e)}", exc_info=True)
            return f"I apologize, but I encountered an error: {str(e)}. Please try again."

# Create a singleton instance
_chatbot_instance = None

def get_chatbot() -> ChatBot:
    """Get or create the chatbot instance."""
    global _chatbot_instance
    if _chatbot_instance is None:
        _chatbot_instance = ChatBot()
    return _chatbot_instance 