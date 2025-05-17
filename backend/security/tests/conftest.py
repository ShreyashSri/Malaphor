import pytest
from datetime import datetime, timezone

@pytest.fixture
def sample_graph_data():
    """Sample graph data for testing."""
    return {
        's3_buckets': [{
            'id': 'bucket-1',
            'name': 'test-bucket',
            'policy': {
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': '*',
                    'Action': 's3:GetObject',
                    'Resource': 'arn:aws:s3:::test-bucket/*'
                }]
            }
        }],
        'security_groups': [{
            'id': 'sg-1',
            'name': 'test-sg',
            'rules': [{
                'port': 22,
                'protocol': 'tcp',
                'cidr': '0.0.0.0/0'
            }]
        }],
        'iam_roles': [{
            'id': 'role-1',
            'name': 'test-role',
            'trust_policy': {
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': '*',
                    'Action': 'sts:AssumeRole'
                }]
            }
        }]
    }

@pytest.fixture
def current_time():
    """Current time in UTC."""
    return datetime.now(timezone.utc) 