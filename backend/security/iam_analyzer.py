from typing import Dict, List, Any
from .base_analyzer import SecurityAnalyzer
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class IAMAnalyzer(SecurityAnalyzer):
    """Analyzer for detecting IAM-related security issues."""
    
    # Maximum age for access keys in days
    MAX_KEY_AGE_DAYS = 90
    
    def analyze(self, graph_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Analyze IAM resources for security issues.
        
        Args:
            graph_data: Dictionary containing the cloud resource graph data
            
        Returns:
            List of security findings
        """
        self.clear_findings()
        
        # Analyze IAM roles
        if 'iam_roles' in graph_data:
            for role in graph_data['iam_roles']:
                self._analyze_iam_role(role)
        
        # Analyze IAM users
        if 'iam_users' in graph_data:
            for user in graph_data['iam_users']:
                self._analyze_iam_user(user)
        
        return self.get_findings()
    
    def _analyze_iam_role(self, role: Dict[str, Any]) -> None:
        """Analyze an IAM role for security issues."""
        role_id = role.get('id')
        role_name = role.get('name')
        
        # Check trust policy
        if 'trust_policy' in role:
            trust_policy = role['trust_policy']
            
            # Check for overly permissive trust relationships
            if self._has_overly_permissive_trust(trust_policy):
                self.add_finding(
                    resource_id=role_id,
                    severity='critical',
                    title='Overly Permissive Role Trust Policy',
                    description=f'IAM role {role_name} has an overly permissive trust policy.',
                    recommendation='Restrict the trust policy to specific AWS accounts and services. Add conditions to limit the scope of trust.',
                    evidence={'trust_policy': trust_policy}
                )
            
            # Check for missing source ARN conditions
            if self._has_missing_source_arn(trust_policy):
                self.add_finding(
                    resource_id=role_id,
                    severity='high',
                    title='Missing Source ARN Condition',
                    description=f'IAM role {role_name} allows role assumption without source ARN restrictions.',
                    recommendation='Add aws:SourceArn condition to restrict which resources can assume this role.',
                    evidence={'trust_policy': trust_policy}
                )
        
        # Check attached policies
        if 'attached_policies' in role:
            for policy in role['attached_policies']:
                if self._has_overly_permissive_policy(policy):
                    self.add_finding(
                        resource_id=role_id,
                        severity='high',
                        title='Overly Permissive Attached Policy',
                        description=f'IAM role {role_name} has an overly permissive policy attached: {policy.get("name")}.',
                        recommendation='Review and restrict the policy permissions to follow the principle of least privilege.',
                        evidence={'policy': policy}
                    )
    
    def _analyze_iam_user(self, user: Dict[str, Any]) -> None:
        """Analyze an IAM user for security issues."""
        user_id = user.get('id')
        username = user.get('name')
        
        # Check access keys
        if 'access_keys' in user:
            for key in user['access_keys']:
                if self._is_old_access_key(key):
                    self.add_finding(
                        resource_id=user_id,
                        severity='medium',
                        title='Old Access Key',
                        description=f'IAM user {username} has an access key older than {self.MAX_KEY_AGE_DAYS} days.',
                        recommendation='Rotate the access key and delete the old one.',
                        evidence={'access_key': key}
                    )
        
        # Check attached policies
        if 'attached_policies' in user:
            for policy in user['attached_policies']:
                if self._has_overly_permissive_policy(policy):
                    self.add_finding(
                        resource_id=user_id,
                        severity='high',
                        title='Overly Permissive Attached Policy',
                        description=f'IAM user {username} has an overly permissive policy attached: {policy.get("name")}.',
                        recommendation='Review and restrict the policy permissions to follow the principle of least privilege.',
                        evidence={'policy': policy}
                    )
    
    def _has_overly_permissive_trust(self, trust_policy: Dict[str, Any]) -> bool:
        """Check if a trust policy is overly permissive."""
        if not trust_policy or 'Statement' not in trust_policy:
            return False
            
        for statement in trust_policy['Statement']:
            principal = statement.get('Principal', {})
            
            # Check for wildcard principal
            if principal == '*' or principal.get('AWS') == '*':
                return True
                
            # Check for overly permissive service principal
            if 'Service' in principal:
                service = principal['Service']
                if isinstance(service, str) and service == '*':
                    return True
                if isinstance(service, list) and '*' in service:
                    return True
                    
        return False
    
    def _has_missing_source_arn(self, trust_policy: Dict[str, Any]) -> bool:
        """Check if a trust policy is missing source ARN conditions."""
        if not trust_policy or 'Statement' not in trust_policy:
            return False
            
        for statement in trust_policy['Statement']:
            # Check if this is a role assumption statement
            if statement.get('Action') == 'sts:AssumeRole':
                # Check if there are no conditions
                if 'Condition' not in statement:
                    return True
                # Check if there's no source ARN condition
                if 'StringEquals' not in statement['Condition'] or 'aws:SourceArn' not in statement['Condition']['StringEquals']:
                    return True
                    
        return False
    
    def _has_overly_permissive_policy(self, policy: Dict[str, Any]) -> bool:
        """Check if a policy is overly permissive."""
        if not policy or 'Statement' not in policy:
            return False
            
        for statement in policy['Statement']:
            # Check for wildcard actions
            actions = statement.get('Action', [])
            if isinstance(actions, str):
                actions = [actions]
            if '*' in actions or any(action.endswith(':*') for action in actions):
                return True
                
            # Check for wildcard resources
            resources = statement.get('Resource', [])
            if isinstance(resources, str):
                resources = [resources]
            if '*' in resources or any(resource.endswith('*') for resource in resources):
                return True
                
        return False
    
    def _is_old_access_key(self, key: Dict[str, Any]) -> bool:
        """Check if an access key is too old."""
        if 'create_date' not in key:
            return False
            
        create_date = key['create_date']
        if isinstance(create_date, str):
            create_date = datetime.fromisoformat(create_date.replace('Z', '+00:00'))
            
        age = datetime.now(timezone.utc) - create_date
        return age.days > self.MAX_KEY_AGE_DAYS 