import pytest
from datetime import datetime, timedelta, timezone
from ..iam_analyzer import IAMAnalyzer

def test_overly_permissive_trust_policy():
    analyzer = IAMAnalyzer()
    
    # Test data with overly permissive trust policy
    graph_data = {
        'iam_roles': [{
            'id': 'role-123',
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
    
    findings = analyzer.analyze(graph_data)
    
    assert len(findings) == 2  # Both trust policy and source ARN checks should trigger
    trust_finding = next(f for f in findings if f['title'] == 'Overly Permissive Role Trust Policy')
    source_arn_finding = next(f for f in findings if f['title'] == 'Missing Source ARN Condition')
    assert trust_finding['severity'] == 'critical'
    assert source_arn_finding['severity'] == 'high'

def test_missing_source_arn():
    analyzer = IAMAnalyzer()
    
    # Test data with missing source ARN condition
    graph_data = {
        'iam_roles': [{
            'id': 'role-456',
            'name': 'test-role',
            'trust_policy': {
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': {'Service': 'lambda.amazonaws.com'},
                    'Action': 'sts:AssumeRole'
                }]
            }
        }]
    }
    
    findings = analyzer.analyze(graph_data)
    
    assert len(findings) == 1
    finding = findings[0]
    assert finding['severity'] == 'high'
    assert finding['title'] == 'Missing Source ARN Condition'

def test_overly_permissive_policy():
    analyzer = IAMAnalyzer()
    
    # Test data with overly permissive policy
    graph_data = {
        'iam_roles': [{
            'id': 'role-789',
            'name': 'test-role',
            'attached_policies': [{
                'name': 'test-policy',
                'Statement': [{
                    'Effect': 'Allow',
                    'Action': '*',
                    'Resource': '*'
                }]
            }]
        }]
    }
    
    findings = analyzer.analyze(graph_data)
    
    assert len(findings) == 1
    finding = findings[0]
    assert finding['severity'] == 'high'
    assert finding['title'] == 'Overly Permissive Attached Policy'

def test_old_access_key():
    analyzer = IAMAnalyzer()
    
    # Create a date 100 days ago
    old_date = datetime.now(timezone.utc) - timedelta(days=100)
    
    # Test data with old access key
    graph_data = {
        'iam_users': [{
            'id': 'user-123',
            'name': 'test-user',
            'access_keys': [{
                'id': 'AKIA1234567890',
                'create_date': old_date.isoformat()
            }]
        }]
    }
    
    findings = analyzer.analyze(graph_data)
    
    assert len(findings) == 1
    finding = findings[0]
    assert finding['severity'] == 'medium'
    assert finding['title'] == 'Old Access Key'

def test_no_issues():
    analyzer = IAMAnalyzer()
    
    # Test data with properly configured IAM resources
    graph_data = {
        'iam_roles': [{
            'id': 'role-123',
            'name': 'test-role',
            'trust_policy': {
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': {'Service': 'lambda.amazonaws.com'},
                    'Action': 'sts:AssumeRole',
                    'Condition': {
                        'StringEquals': {
                            'aws:SourceArn': 'arn:aws:lambda:us-east-1:123456789012:function:test-function'
                        }
                    }
                }]
            },
            'attached_policies': [{
                'name': 'test-policy',
                'Statement': [{
                    'Effect': 'Allow',
                    'Action': 'logs:CreateLogGroup',
                    'Resource': 'arn:aws:logs:us-east-1:123456789012:log-group:/aws/lambda/test-function:*'
                }]
            }]
        }],
        'iam_users': [{
            'id': 'user-123',
            'name': 'test-user',
            'access_keys': [{
                'id': 'AKIA1234567890',
                'create_date': datetime.now(timezone.utc).isoformat()
            }]
        }]
    }
    
    findings = analyzer.analyze(graph_data)
    assert len(findings) == 0 