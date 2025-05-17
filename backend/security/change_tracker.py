from datetime import datetime
from typing import Dict, List, Any, Optional
import json
import hashlib
from pydantic import BaseModel

class ConfigurationChange(BaseModel):
    resource_id: str
    resource_type: str
    change_type: str  # 'added', 'modified', 'deleted'
    old_value: Optional[Dict[str, Any]]
    new_value: Optional[Dict[str, Any]]
    timestamp: datetime
    change_hash: str
    user: Optional[str]  # If available from CloudTrail
    source_ip: Optional[str]  # If available from CloudTrail

class ChangeTracker:
    def __init__(self, storage_path: str = "change_history.json"):
        self.storage_path = storage_path
        self.changes: List[ConfigurationChange] = []
        self._load_history()

    def _load_history(self):
        """Load change history from storage."""
        try:
            with open(self.storage_path, 'r') as f:
                data = json.load(f)
                self.changes = [ConfigurationChange(**change) for change in data]
        except FileNotFoundError:
            self.changes = []

    def _save_history(self):
        """Save change history to storage."""
        with open(self.storage_path, 'w') as f:
            json.dump([change.dict() for change in self.changes], f, default=str)

    def _compute_hash(self, config: Dict[str, Any]) -> str:
        """Compute a hash of the configuration for change detection."""
        config_str = json.dumps(config, sort_keys=True)
        return hashlib.sha256(config_str.encode()).hexdigest()

    def track_changes(self, current_state: Dict[str, Any], previous_state: Optional[Dict[str, Any]] = None) -> List[ConfigurationChange]:
        """Track changes between current and previous state."""
        new_changes = []

        if previous_state is None:
            # First run - mark everything as added
            for resource_type, resources in current_state.items():
                for resource in resources:
                    change = ConfigurationChange(
                        resource_id=resource['id'],
                        resource_type=resource_type,
                        change_type='added',
                        old_value=None,
                        new_value=resource,
                        timestamp=datetime.utcnow(),
                        change_hash=self._compute_hash(resource),
                        user=None,
                        source_ip=None
                    )
                    new_changes.append(change)
        else:
            # Compare with previous state
            for resource_type, resources in current_state.items():
                prev_resources = {r['id']: r for r in previous_state.get(resource_type, [])}
                
                for resource in resources:
                    resource_id = resource['id']
                    if resource_id not in prev_resources:
                        # New resource
                        change = ConfigurationChange(
                            resource_id=resource_id,
                            resource_type=resource_type,
                            change_type='added',
                            old_value=None,
                            new_value=resource,
                            timestamp=datetime.utcnow(),
                            change_hash=self._compute_hash(resource),
                            user=None,
                            source_ip=None
                        )
                        new_changes.append(change)
                    else:
                        # Modified resource
                        old_resource = prev_resources[resource_id]
                        if self._compute_hash(old_resource) != self._compute_hash(resource):
                            change = ConfigurationChange(
                                resource_id=resource_id,
                                resource_type=resource_type,
                                change_type='modified',
                                old_value=old_resource,
                                new_value=resource,
                                timestamp=datetime.utcnow(),
                                change_hash=self._compute_hash(resource),
                                user=None,
                                source_ip=None
                            )
                            new_changes.append(change)
                        del prev_resources[resource_id]

                # Check for deleted resources
                for resource_id, resource in prev_resources.items():
                    change = ConfigurationChange(
                        resource_id=resource_id,
                        resource_type=resource_type,
                        change_type='deleted',
                        old_value=resource,
                        new_value=None,
                        timestamp=datetime.utcnow(),
                        change_hash=self._compute_hash(resource),
                        user=None,
                        source_ip=None
                    )
                    new_changes.append(change)

        # Add new changes to history
        self.changes.extend(new_changes)
        self._save_history()
        return new_changes

    def get_recent_changes(self, hours: int = 24) -> List[ConfigurationChange]:
        """Get changes from the last N hours."""
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        return [change for change in self.changes if change.timestamp > cutoff]

    def get_suspicious_changes(self) -> List[ConfigurationChange]:
        """Identify potentially suspicious changes."""
        suspicious_changes = []
        
        for change in self.changes:
            # Check for high-risk changes
            if change.resource_type == 'security_groups':
                if change.change_type == 'modified':
                    # Check for opening of sensitive ports
                    if change.new_value and 'rules' in change.new_value:
                        for rule in change.new_value['rules']:
                            if rule.get('port') in [22, 3389] and rule.get('cidr') == '0.0.0.0/0':
                                suspicious_changes.append(change)
                                break

            elif change.resource_type == 'iam_roles':
                if change.change_type in ['modified', 'added']:
                    # Check for overly permissive policies
                    if change.new_value and 'attached_policies' in change.new_value:
                        for policy in change.new_value['attached_policies']:
                            if any(statement.get('Action') == '*' for statement in policy.get('Statement', [])):
                                suspicious_changes.append(change)
                                break

            elif change.resource_type == 's3_buckets':
                if change.change_type == 'modified':
                    # Check for public access changes
                    if change.new_value and 'policy' in change.new_value:
                        policy = change.new_value['policy']
                        if isinstance(policy, str):
                            policy = json.loads(policy)
                        if any(
                            statement.get('Effect') == 'Allow' and 
                            statement.get('Principal') == '*' 
                            for statement in policy.get('Statement', [])
                        ):
                            suspicious_changes.append(change)

        return suspicious_changes

    def get_change_summary(self) -> Dict[str, Any]:
        """Get a summary of recent changes."""
        recent_changes = self.get_recent_changes(24)  # Last 24 hours
        suspicious_changes = self.get_suspicious_changes()

        return {
            'total_changes': len(recent_changes),
            'suspicious_changes': len(suspicious_changes),
            'changes_by_type': {
                'added': len([c for c in recent_changes if c.change_type == 'added']),
                'modified': len([c for c in recent_changes if c.change_type == 'modified']),
                'deleted': len([c for c in recent_changes if c.change_type == 'deleted'])
            },
            'changes_by_resource': {
                resource_type: len([c for c in recent_changes if c.resource_type == resource_type])
                for resource_type in set(c.resource_type for c in recent_changes)
            }
        } 