from typing import Dict, Any, List
from .base_analyzer import SecurityAnalyzer

class CloudTrailParser(SecurityAnalyzer):
    """Parser for AWS CloudTrail logs."""
    
    def __init__(self):
        self.findings = []
        
    def parse(self, logs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse CloudTrail logs and extract relevant information.
        
        Args:
            logs: CloudTrail logs in JSON format
            
        Returns:
            Dictionary containing parsed data
        """
        if not isinstance(logs, dict):
            raise ValueError("Logs must be a dictionary")
            
        if "Records" not in logs:
            raise ValueError("No 'Records' found in logs")
            
        parsed_data = {
            "users": set(),
            "resources": set(),
            "actions": set(),
            "events": []
        }
        
        for record in logs["Records"]:
            # Extract user information
            if "userIdentity" in record:
                user = record["userIdentity"]
                if "userName" in user:
                    parsed_data["users"].add(user["userName"])
                elif "arn" in user:
                    parsed_data["users"].add(user["arn"])
                    
            # Extract resource information
            if "resources" in record:
                for resource in record["resources"]:
                    if "ARN" in resource:
                        parsed_data["resources"].add(resource["ARN"])
                        
            # Extract action information
            if "eventName" in record:
                parsed_data["actions"].add(record["eventName"])
                
            # Store the full event
            parsed_data["events"].append(record)
            
        # Convert sets to lists for JSON serialization
        parsed_data["users"] = list(parsed_data["users"])
        parsed_data["resources"] = list(parsed_data["resources"])
        parsed_data["actions"] = list(parsed_data["actions"])
        
        return parsed_data
        
    def analyze(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze CloudTrail logs for security issues.
        
        Args:
            data: Parsed CloudTrail logs
            
        Returns:
            Dictionary containing analysis results
        """
        self.findings = []
        
        # Check for suspicious patterns
        for event in data["events"]:
            # Check for failed login attempts
            if event.get("eventName") == "ConsoleLogin" and event.get("errorCode"):
                self.findings.append({
                    "type": "FailedLogin",
                    "severity": "High",
                    "description": f"Failed console login attempt by {event.get('userIdentity', {}).get('userName', 'Unknown')}",
                    "event": event
                })
                
            # Check for IAM changes
            if event.get("eventName", "").startswith("Create") and "iam" in event.get("eventSource", "").lower():
                self.findings.append({
                    "type": "IAMChange",
                    "severity": "Medium",
                    "description": f"IAM change detected: {event.get('eventName')}",
                    "event": event
                })
                
        return {
            "findings": self.findings,
            "summary": {
                "total_findings": len(self.findings),
                "high_severity": len([f for f in self.findings if f["severity"] == "High"]),
                "medium_severity": len([f for f in self.findings if f["severity"] == "Medium"]),
                "low_severity": len([f for f in self.findings if f["severity"] == "Low"])
            }
        }
        
    def get_findings(self) -> List[Dict[str, Any]]:
        """
        Get the security findings from the analysis.
        
        Returns:
            List of security findings
        """
        return self.findings 