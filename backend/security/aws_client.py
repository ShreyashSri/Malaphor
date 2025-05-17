import boto3
from botocore.exceptions import ClientError
from typing import Dict, Any
from .change_tracker import ChangeTracker

class AWSClient:
    def __init__(self, aws_access_key_id: str, aws_secret_access_key: str, region_name: str = 'us-east-1'):
        """Initialize AWS client with credentials."""
        self.session = boto3.Session(
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region_name=region_name
        )
        
        # Initialize AWS service clients
        self.s3 = self.session.client('s3')
        self.ec2 = self.session.client('ec2')
        self.iam = self.session.client('iam')
        self.cloudtrail = self.session.client('cloudtrail')
        
        # Initialize change tracker
        self.change_tracker = ChangeTracker()
        
    def get_s3_buckets(self) -> Dict[str, Any]:
        """Get all S3 buckets and their policies."""
        buckets = []
        try:
            response = self.s3.list_buckets()
            for bucket in response['Buckets']:
                bucket_name = bucket['Name']
                try:
                    policy = self.s3.get_bucket_policy(Bucket=bucket_name)
                    bucket_data = {
                        'id': bucket_name,
                        'name': bucket_name,
                        'policy': policy.get('Policy', {})
                    }
                except ClientError:
                    bucket_data = {
                        'id': bucket_name,
                        'name': bucket_name,
                        'policy': {}
                    }
                buckets.append(bucket_data)
        except ClientError as e:
            print(f"Error fetching S3 buckets: {e}")
        return {'s3_buckets': buckets}
    
    def get_security_groups(self) -> Dict[str, Any]:
        """Get all security groups and their rules."""
        security_groups = []
        try:
            response = self.ec2.describe_security_groups()
            for sg in response['SecurityGroups']:
                rules = []
                for rule in sg['IpPermissions']:
                    for ip_range in rule.get('IpRanges', []):
                        rules.append({
                            'port': rule.get('FromPort'),
                            'protocol': rule.get('IpProtocol'),
                            'cidr': ip_range.get('CidrIp')
                        })
                security_groups.append({
                    'id': sg['GroupId'],
                    'name': sg['GroupName'],
                    'rules': rules
                })
        except ClientError as e:
            print(f"Error fetching security groups: {e}")
        return {'security_groups': security_groups}
    
    def get_ec2_instances(self) -> Dict[str, Any]:
        """Get all EC2 instances and their subnet information."""
        instances = []
        try:
            response = self.ec2.describe_instances()
            for reservation in response['Reservations']:
                for instance in reservation['Instances']:
                    subnet_id = instance.get('SubnetId')
                    if subnet_id:
                        subnet_info = self.ec2.describe_subnets(SubnetIds=[subnet_id])
                        is_public = subnet_info['Subnets'][0].get('MapPublicIpOnLaunch', False)
                        instances.append({
                            'id': instance['InstanceId'],
                            'subnet': {
                                'id': subnet_id,
                                'is_public': is_public
                            }
                        })
        except ClientError as e:
            print(f"Error fetching EC2 instances: {e}")
        return {'ec2_instances': instances}
    
    def get_iam_roles(self) -> Dict[str, Any]:
        """Get all IAM roles and their policies."""
        roles = []
        try:
            response = self.iam.list_roles()
            for role in response['Roles']:
                role_name = role['RoleName']
                try:
                    trust_policy = self.iam.get_role(RoleName=role_name)['Role']['AssumeRolePolicyDocument']
                    attached_policies = []
                    for policy in self.iam.list_attached_role_policies(RoleName=role_name)['AttachedPolicies']:
                        policy_version = self.iam.get_policy_version(
                            PolicyArn=policy['PolicyArn'],
                            VersionId=self.iam.get_policy(PolicyArn=policy['PolicyArn'])['Policy']['DefaultVersionId']
                        )
                        attached_policies.append({
                            'name': policy['PolicyName'],
                            'Statement': policy_version['PolicyVersion']['Document']['Statement']
                        })
                    roles.append({
                        'id': role['RoleId'],
                        'name': role_name,
                        'trust_policy': trust_policy,
                        'attached_policies': attached_policies
                    })
                except ClientError as e:
                    print(f"Error fetching IAM role {role_name}: {e}")
        except ClientError as e:
            print(f"Error fetching IAM roles: {e}")
        return {'iam_roles': roles}
    
    def get_cloud_graph_data(self) -> Dict[str, Any]:
        """Get all cloud resources data and track changes."""
        graph_data = {}
        graph_data.update(self.get_s3_buckets())
        graph_data.update(self.get_security_groups())
        graph_data.update(self.get_ec2_instances())
        graph_data.update(self.get_iam_roles())
        
        # Track changes
        changes = self.change_tracker.track_changes(graph_data)
        
        # Get suspicious changes
        suspicious_changes = self.change_tracker.get_suspicious_changes()
        
        # Add change information to the response
        graph_data['changes'] = {
            'recent': [change.dict() for change in changes],
            'suspicious': [change.dict() for change in suspicious_changes],
            'summary': self.change_tracker.get_change_summary()
        }
        
        return graph_data 