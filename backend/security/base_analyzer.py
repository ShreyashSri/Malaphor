from abc import ABC, abstractmethod
from typing import Dict, Any, List

class SecurityAnalyzer(ABC):
    """Base class for security analyzers."""
    
    @abstractmethod
    def analyze(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze security data and return findings.
        
        Args:
            data: The data to analyze
            
        Returns:
            Dictionary containing analysis results
        """
        pass
    
    @abstractmethod
    def get_findings(self) -> List[Dict[str, Any]]:
        """
        Get the security findings from the analysis.
        
        Returns:
            List of security findings
        """
        pass 