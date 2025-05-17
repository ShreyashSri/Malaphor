from typing import Dict, List, Any
from .base_analyzer import SecurityAnalyzer
import logging

logger = logging.getLogger(__name__)

class StorageAnalyzer(SecurityAnalyzer):
    """Analyzer for detecting storage-related security issues."""
    
    def analyze(self, graph_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Analyze storage resources for security issues.
        
        Args:
            graph_data: Dictionary containing the cloud resource graph data
            
        Returns:
            List of security findings
        """
        self.clear_findings()
        
        # Analyze S3 buckets
        if 's3_buckets' in graph_data:
            for bucket in graph_data['s3_buckets']:
                self._analyze_s3_bucket(bucket)
        
        return self.get_findings()
    
    def _analyze_s3_bucket(self, bucket: Dict[str, Any]) -> None:
        """Analyze a single S3 bucket for security issues."""
        bucket_id = bucket.get('id')
        bucket_name = bucket.get('name')
        
        # Check bucket policy
        if 'policy' in bucket:
            policy = bucket['policy']
            
            # Check for public access
            if self._has_public_access(policy):
                self.add_finding(
                    resource_id=bucket_id,
                    severity='critical',
                    title='Public S3 Bucket Access',
                    description=f'S3 bucket {bucket_name} has public access enabled through its bucket policy.',
                    recommendation='Modify the bucket policy to restrict access to specific IAM roles or users. Remove any statements with "Principal": "*" or "Principal": {"AWS": "*"}.',
                    evidence={'policy': policy}
                )
            
            # Check for overly permissive actions
            if self._has_overly_permissive_actions(policy):
                self.add_finding(
                    resource_id=bucket_id,
                    severity='high',
                    title='Overly Permissive S3 Bucket Policy',
                    description=f'S3 bucket {bucket_name} has overly permissive actions in its bucket policy.',
                    recommendation='Follow the principle of least privilege. Only grant the minimum permissions necessary for each principal.',
                    evidence={'policy': policy}
                )
        
        # Check bucket ACL
        if 'acl' in bucket:
            acl = bucket['acl']
            if self._has_public_acl(acl):
                self.add_finding(
                    resource_id=bucket_id,
                    severity='critical',
                    title='Public S3 Bucket ACL',
                    description=f'S3 bucket {bucket_name} has public access enabled through its ACL.',
                    recommendation='Disable public access through ACLs. Use bucket policies for access control instead.',
                    evidence={'acl': acl}
                )
    
    def _has_public_access(self, policy: Dict[str, Any]) -> bool:
        """Check if a bucket policy allows public access."""
        if not policy or 'Statement' not in policy:
            return False
            
        for statement in policy['Statement']:
            # Check for public principal
            principal = statement.get('Principal', {})
            if principal == '*' or principal.get('AWS') == '*':
                # Check if the effect is Allow
                if statement.get('Effect') == 'Allow':
                    return True
        return False
    
    def _has_overly_permissive_actions(self, policy: Dict[str, Any]) -> bool:
        """Check if a bucket policy has overly permissive actions."""
        if not policy or 'Statement' not in policy:
            return False
            
        for statement in policy['Statement']:
            actions = statement.get('Action', [])
            if isinstance(actions, str):
                actions = [actions]
                
            # Check for wildcard actions
            if '*' in actions or 's3:*' in actions:
                return True
                
            # Check for dangerous action combinations
            dangerous_actions = {'s3:PutObject', 's3:DeleteObject', 's3:GetObject'}
            if all(action in actions for action in dangerous_actions):
                return True
                
        return False
    
    def _has_public_acl(self, acl: Dict[str, Any]) -> bool:
        """Check if a bucket ACL allows public access."""
        if not acl or 'Grants' not in acl:
            return False
            
        for grant in acl['Grants']:
            grantee = grant.get('Grantee', {})
            # Check for public grantee
            if grantee.get('URI') == 'http://acs.amazonaws.com/groups/global/AllUsers':
                return True
            if grantee.get('URI') == 'http://acs.amazonaws.com/groups/global/AuthenticatedUsers':
                return True
                
        return False 