from abc import ABC, abstractmethod
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class SecurityAnalyzer(ABC):
    """Base class for all security analyzers."""
    
    def __init__(self):
        self.findings: List[Dict[str, Any]] = []
    
    @abstractmethod
    def analyze(self, graph_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Analyze the cloud graph for security issues.
        
        Args:
            graph_data: Dictionary containing the cloud resource graph data
            
        Returns:
            List of security findings, where each finding is a dictionary with:
            - resource_id: ID of the affected resource
            - severity: 'critical', 'high', 'medium', or 'low'
            - title: Short description of the issue
            - description: Detailed explanation of the issue
            - recommendation: How to fix the issue
            - evidence: Supporting data that proves the issue exists
        """
        pass
    
    def add_finding(self, 
                   resource_id: str,
                   severity: str,
                   title: str,
                   description: str,
                   recommendation: str,
                   evidence: Dict[str, Any]) -> None:
        """Add a security finding to the findings list."""
        finding = {
            'resource_id': resource_id,
            'severity': severity,
            'title': title,
            'description': description,
            'recommendation': recommendation,
            'evidence': evidence
        }
        self.findings.append(finding)
        logger.info(f"Added {severity} severity finding for resource {resource_id}: {title}")
    
    def get_findings(self) -> List[Dict[str, Any]]:
        """Get all security findings."""
        return self.findings
    
    def clear_findings(self) -> None:
        """Clear all security findings."""
        self.findings = [] 