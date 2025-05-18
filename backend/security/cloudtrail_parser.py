from typing import Dict, Any, List, Union
import json
from datetime import datetime

class CloudTrailParser:
    """Parser for AWS CloudTrail logs."""
    
    def parse(self, logs: Union[str, Dict[str, Any]]) -> Dict[str, Any]:
        """
        Parse CloudTrail logs into the format expected by our analyzers.
        
        Args:
            logs: Either a JSON string or dictionary containing CloudTrail logs
            
        Returns:
            Dictionary in the format expected by our analyzers
        """
        # If input is a string, parse it as JSON
        if isinstance(logs, str):
            try:
                logs = json.loads(logs)
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid JSON format: {str(e)}")
        
        parsed_data = {
            "s3_buckets": [],
            "security_groups": [],
            "ec2_instances": [],
            "iam_roles": [],
            "iam_users": []
        }
        
        if "Records" not in logs:
            return parsed_data
            
        for record in logs["Records"]:
            # Extract user information
            if "userIdentity" in record:
                user = record["userIdentity"]
                if user["type"] == "IAMUser":
                    parsed_data["iam_users"].append({
                        "id": user["principalId"],
                        "name": user["userName"],
                        "arn": user["arn"],
                        "access_key_id": user.get("accessKeyId")
                    })
            
            # Extract EC2 instance information
            if record["eventSource"] == "ec2.amazonaws.com":
                if record["eventName"] == "DescribeInstances":
                    # Note: We don't have instance details in these logs
                    # This would need to be populated from actual EC2 API calls
                    pass
                    
            # Extract IAM role information
            if record["eventSource"] == "iam.amazonaws.com":
                if record["eventName"] in ["CreateRole", "UpdateRole"]:
                    # Note: We don't have role details in these logs
                    # This would need to be populated from actual IAM API calls
                    pass
                    
            # Extract S3 bucket information
            if record["eventSource"] == "s3.amazonaws.com":
                if record["eventName"] in ["CreateBucket", "PutBucketPolicy"]:
                    # Note: We don't have bucket details in these logs
                    # This would need to be populated from actual S3 API calls
                    pass
        
        return parsed_data 