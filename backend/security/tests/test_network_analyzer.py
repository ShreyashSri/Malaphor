import pytest
from ..network_analyzer import NetworkAnalyzer

def test_public_security_group():
    analyzer = NetworkAnalyzer()
    
    # Test data with a security group allowing public access
    graph_data = {
        'security_groups': [{
            'id': 'sg-123456',
            'name': 'test-sg',
            'rules': [{
                'port': 22,
                'protocol': 'tcp',
                'cidr': '0.0.0.0/0'
            }]
        }]
    }
    
    findings = analyzer.analyze(graph_data)
    
    assert len(findings) == 2  # One for public access, one for sensitive port
    public_finding = next(f for f in findings if f['title'] == 'Public Access in Security Group')
    assert public_finding['severity'] == 'high'
    assert 'test-sg' in public_finding['description']

def test_sensitive_port_exposure():
    analyzer = NetworkAnalyzer()
    
    # Test data with exposed sensitive ports
    graph_data = {
        'security_groups': [{
            'id': 'sg-789012',
            'name': 'test-sg',
            'rules': [
                {
                    'port': 3389,  # RDP
                    'protocol': 'tcp',
                    'cidr': '10.0.0.0/16'
                },
                {
                    'port': 5432,  # PostgreSQL
                    'protocol': 'tcp',
                    'cidr': '0.0.0.0/0'
                }
            ]
        }]
    }
    
    findings = analyzer.analyze(graph_data)
    
    # We should get 3 findings:
    # 1. Public access to PostgreSQL
    # 2. RDP port exposure
    # 3. PostgreSQL port exposure
    assert len(findings) == 3
    
    # Check for public access finding
    public_finding = next(f for f in findings if f['title'] == 'Public Access in Security Group')
    assert public_finding['severity'] == 'high'
    
    # Check for RDP exposure
    rdp_finding = next(f for f in findings if 'RDP' in f['title'])
    assert rdp_finding['severity'] == 'critical'
    
    # Check for PostgreSQL exposure
    postgres_finding = next(f for f in findings if 'PostgreSQL' in f['title'])
    assert postgres_finding['severity'] == 'critical'

def test_ec2_public_subnet():
    analyzer = NetworkAnalyzer()
    
    # Test data with EC2 instance in public subnet
    graph_data = {
        'ec2_instances': [{
            'id': 'i-123456',
            'subnet': {
                'id': 'subnet-123456',
                'is_public': True
            }
        }]
    }
    
    findings = analyzer.analyze(graph_data)
    
    assert len(findings) == 1
    finding = findings[0]
    assert finding['severity'] == 'medium'
    assert finding['title'] == 'EC2 Instance in Public Subnet'

def test_privileged_ecs_container():
    analyzer = NetworkAnalyzer()
    
    # Test data with privileged ECS container
    graph_data = {
        'ecs_services': [{
            'id': 'ecs-service-123',
            'task_definition': {
                'privileged': True
            }
        }]
    }
    
    findings = analyzer.analyze(graph_data)
    
    assert len(findings) == 1
    finding = findings[0]
    assert finding['severity'] == 'high'
    assert finding['title'] == 'Privileged ECS Container'

def test_eks_missing_pod_security():
    analyzer = NetworkAnalyzer()
    
    # Test data with EKS cluster missing pod security policies
    graph_data = {
        'eks_clusters': [{
            'id': 'eks-cluster-123',
            'pod_security_policies': None
        }]
    }
    
    findings = analyzer.analyze(graph_data)
    
    assert len(findings) == 1
    finding = findings[0]
    assert finding['severity'] == 'high'
    assert finding['title'] == 'Missing Pod Security Policies'

def test_no_issues():
    analyzer = NetworkAnalyzer()
    
    # Test data with properly configured resources
    graph_data = {
        'security_groups': [{
            'id': 'sg-123456',
            'name': 'test-sg',
            'rules': [{
                'port': 80,
                'protocol': 'tcp',
                'cidr': '10.0.0.0/16'
            }]
        }],
        'ec2_instances': [{
            'id': 'i-123456',
            'subnet': {
                'id': 'subnet-123456',
                'is_public': False
            }
        }],
        'ecs_services': [{
            'id': 'ecs-service-123',
            'task_definition': {
                'privileged': False
            }
        }],
        'eks_clusters': [{
            'id': 'eks-cluster-123',
            'pod_security_policies': ['restricted']
        }]
    }
    
    findings = analyzer.analyze(graph_data)
    assert len(findings) == 0 