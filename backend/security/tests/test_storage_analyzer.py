import pytest
from ..storage_analyzer import StorageAnalyzer

def test_public_s3_bucket_policy():
    analyzer = StorageAnalyzer()
    
    # Test data with a public bucket policy
    graph_data = {
        's3_buckets': [{
            'id': 'test-bucket-1',
            'name': 'test-bucket',
            'policy': {
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': '*',
                    'Action': 's3:GetObject',
                    'Resource': 'arn:aws:s3:::test-bucket/*'
                }]
            }
        }]
    }
    
    findings = analyzer.analyze(graph_data)
    
    assert len(findings) == 1
    finding = findings[0]
    assert finding['severity'] == 'critical'
    assert finding['title'] == 'Public S3 Bucket Access'
    assert 'test-bucket' in finding['description']

def test_overly_permissive_s3_bucket_policy():
    analyzer = StorageAnalyzer()
    
    # Test data with an overly permissive bucket policy
    graph_data = {
        's3_buckets': [{
            'id': 'test-bucket-2',
            'name': 'test-bucket',
            'policy': {
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': {'AWS': 'arn:aws:iam::123456789012:user/test-user'},
                    'Action': ['s3:PutObject', 's3:DeleteObject', 's3:GetObject'],
                    'Resource': 'arn:aws:s3:::test-bucket/*'
                }]
            }
        }]
    }
    
    findings = analyzer.analyze(graph_data)
    
    assert len(findings) == 1
    finding = findings[0]
    assert finding['severity'] == 'high'
    assert finding['title'] == 'Overly Permissive S3 Bucket Policy'

def test_public_s3_bucket_acl():
    analyzer = StorageAnalyzer()
    
    # Test data with a public bucket ACL
    graph_data = {
        's3_buckets': [{
            'id': 'test-bucket-3',
            'name': 'test-bucket',
            'acl': {
                'Grants': [{
                    'Grantee': {
                        'URI': 'http://acs.amazonaws.com/groups/global/AllUsers'
                    },
                    'Permission': 'READ'
                }]
            }
        }]
    }
    
    findings = analyzer.analyze(graph_data)
    
    assert len(findings) == 1
    finding = findings[0]
    assert finding['severity'] == 'critical'
    assert finding['title'] == 'Public S3 Bucket ACL'

def test_no_issues():
    analyzer = StorageAnalyzer()
    
    # Test data with a properly configured bucket
    graph_data = {
        's3_buckets': [{
            'id': 'test-bucket-4',
            'name': 'test-bucket',
            'policy': {
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': {'AWS': 'arn:aws:iam::123456789012:user/test-user'},
                    'Action': 's3:GetObject',
                    'Resource': 'arn:aws:s3:::test-bucket/specific-folder/*'
                }]
            }
        }]
    }
    
    findings = analyzer.analyze(graph_data)
    assert len(findings) == 0 