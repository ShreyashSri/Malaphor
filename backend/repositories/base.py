from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from config import Settings

class BaseRepository(ABC):
    """Base repository class for data access."""
    
    def __init__(self, settings: Settings):
        self.settings = settings
    
    @abstractmethod
    async def get(self, id: str) -> Optional[Dict[str, Any]]:
        """Get a single item by ID."""
        pass
    
    @abstractmethod
    async def list(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """List items with optional filters."""
        pass
    
    @abstractmethod
    async def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new item."""
        pass
    
    @abstractmethod
    async def update(self, id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an existing item."""
        pass
    
    @abstractmethod
    async def delete(self, id: str) -> bool:
        """Delete an item."""
        pass 