from abc import ABC, abstractmethod
from typing import Dict, Any, List
import boto3
from azure.mgmt.resource import ResourceManagementClient
from azure.identity import ClientSecretCredential
from google.cloud import resourcemanager
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class CloudProvider(ABC):
    @abstractmethod
    def get_resources(self) -> Dict[str, Any]:
        """Get all resources from the cloud provider"""
        pass

    @abstractmethod
    def get_resource_relationships(self) -> List[Dict[str, Any]]:
        """Get relationships between resources"""
        pass

class AWSProvider(CloudProvider):
    def __init__(self, access_key: str, secret_key: str, region: str):
        self.session = boto3.Session(
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region
        )
        self.ec2 = self.session.client('ec2')
        self.iam = self.session.client('iam')
        self.s3 = self.session.client('s3')
        self.vpc = self.session.client('ec2')
        self.rds = self.session.client('rds')
        self.lambda_client = self.session.client('lambda')
        # Add other AWS services as needed

    def get_resources(self) -> Dict[str, Any]:
        """Get all AWS resources"""
        try:
            resources = {
                'nodes': [],
                'edges': []
            }
            
            # Get EC2 instances
            self._get_ec2_resources(resources)
            
            # Get IAM resources
            self._get_iam_resources(resources)
            
            # Get S3 resources
            self._get_s3_resources(resources)
            
            # Get VPC resources
            self._get_vpc_resources(resources)
            
            # Get RDS resources
            self._get_rds_resources(resources)
            
            # Get Lambda resources
            self._get_lambda_resources(resources)
            
            return resources
        except Exception as e:
            logger.error(f"Error fetching AWS resources: {e}")
            raise

    def _get_ec2_resources(self, resources: Dict[str, Any]):
        """Get EC2 instances and related resources"""
        try:
            instances = self.ec2.describe_instances()
            for reservation in instances['Reservations']:
                for instance in reservation['Instances']:
                    # Add EC2 instance
                    instance_id = instance['InstanceId']
                    resources['nodes'].append({
                        'id': instance_id,
                        'label': self._get_name_from_tags(instance.get('Tags', [])),
                        'group': 'ec2',
                        'properties': {
                            'state': instance['State']['Name'],
                            'type': instance['InstanceType'],
                            'vpc_id': instance.get('VpcId'),
                            'subnet_id': instance.get('SubnetId'),
                            'private_ip': instance.get('PrivateIpAddress'),
                            'public_ip': instance.get('PublicIpAddress'),
                            'launch_time': instance['LaunchTime'].isoformat(),
                            'security_groups': instance.get('SecurityGroups', [])
                        }
                    })
                    
                    # Add edges for security groups
                    for sg in instance.get('SecurityGroups', []):
                        resources['edges'].append({
                            'id': f"{instance_id}-{sg['GroupId']}",
                            'from_id': instance_id,
                            'to_id': sg['GroupId'],
                            'label': 'belongs_to_security_group'
                        })
        except Exception as e:
            logger.error(f"Error fetching EC2 resources: {e}")
            raise

    def _get_iam_resources(self, resources: Dict[str, Any]):
        """Get IAM users, roles, and policies"""
        try:
            # Get IAM users
            users = self.iam.list_users()
            for user in users['Users']:
                user_name = user['UserName']
                resources['nodes'].append({
                    'id': user_name,
                    'label': user_name,
                    'group': 'iam_user',
                    'properties': {
                        'arn': user['Arn'],
                        'created': user['CreateDate'].isoformat(),
                        'path': user['Path'],
                        'last_used': user.get('PasswordLastUsed', '').isoformat() if user.get('PasswordLastUsed') else None
                    }
                })
                
                # Get user policies
                policies = self.iam.list_user_policies(UserName=user_name)
                for policy_name in policies['PolicyNames']:
                    resources['edges'].append({
                        'id': f"{user_name}-{policy_name}",
                        'from_id': user_name,
                        'to_id': policy_name,
                        'label': 'has_policy'
                    })
        except Exception as e:
            logger.error(f"Error fetching IAM resources: {e}")
            raise

    def _get_s3_resources(self, resources: Dict[str, Any]):
        """Get S3 buckets and their properties"""
        try:
            buckets = self.s3.list_buckets()
            for bucket in buckets['Buckets']:
                bucket_name = bucket['Name']
                
                # Get bucket properties
                try:
                    acl = self.s3.get_bucket_acl(Bucket=bucket_name)
                    public_access = self.s3.get_public_access_block(Bucket=bucket_name)
                except:
                    acl = {}
                    public_access = {}
                
                resources['nodes'].append({
                    'id': bucket_name,
                    'label': bucket_name,
                    'group': 's3',
                    'properties': {
                        'creation_date': bucket['CreationDate'].isoformat(),
                        'acl': acl,
                        'public_access': public_access
                    }
                })
        except Exception as e:
            logger.error(f"Error fetching S3 resources: {e}")
            raise

    def _get_vpc_resources(self, resources: Dict[str, Any]):
        """Get VPC and related networking resources"""
        try:
            vpcs = self.vpc.describe_vpcs()
            for vpc in vpcs['Vpcs']:
                vpc_id = vpc['VpcId']
                resources['nodes'].append({
                    'id': vpc_id,
                    'label': self._get_name_from_tags(vpc.get('Tags', [])),
                    'group': 'vpc',
                    'properties': {
                        'cidr_block': vpc['CidrBlock'],
                        'state': vpc['State'],
                        'is_default': vpc['IsDefault']
                    }
                })
        except Exception as e:
            logger.error(f"Error fetching VPC resources: {e}")
            raise

    def _get_rds_resources(self, resources: Dict[str, Any]):
        """Get RDS instances and clusters"""
        try:
            instances = self.rds.describe_db_instances()
            for instance in instances['DBInstances']:
                instance_id = instance['DBInstanceIdentifier']
                resources['nodes'].append({
                    'id': instance_id,
                    'label': instance_id,
                    'group': 'rds',
                    'properties': {
                        'engine': instance['Engine'],
                        'status': instance['DBInstanceStatus'],
                        'endpoint': instance.get('Endpoint', {}),
                        'vpc_id': instance.get('DBSubnetGroup', {}).get('VpcId')
                    }
                })
        except Exception as e:
            logger.error(f"Error fetching RDS resources: {e}")
            raise

    def _get_lambda_resources(self, resources: Dict[str, Any]):
        """Get Lambda functions"""
        try:
            functions = self.lambda_client.list_functions()
            for function in functions['Functions']:
                function_name = function['FunctionName']
                resources['nodes'].append({
                    'id': function_name,
                    'label': function_name,
                    'group': 'lambda',
                    'properties': {
                        'runtime': function['Runtime'],
                        'handler': function['Handler'],
                        'last_modified': function['LastModified'],
                        'memory': function['MemorySize'],
                        'timeout': function['Timeout'],
                        'vpc_config': function.get('VpcConfig', {})
                    }
                })
        except Exception as e:
            logger.error(f"Error fetching Lambda resources: {e}")
            raise

    def get_resource_relationships(self) -> List[Dict[str, Any]]:
        """Get relationships between AWS resources"""
        try:
            relationships = []
            
            # Get VPC relationships
            vpcs = self.vpc.describe_vpcs()
            for vpc in vpcs['Vpcs']:
                vpc_id = vpc['VpcId']
                
                # Get EC2 instances in VPC
                instances = self.ec2.describe_instances(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])
                for reservation in instances['Reservations']:
                    for instance in reservation['Instances']:
                        relationships.append({
                            'id': f"{vpc_id}-{instance['InstanceId']}",
                            'from_id': instance['InstanceId'],
                            'to_id': vpc_id,
                            'label': 'in_vpc'
                        })
                
                # Get RDS instances in VPC
                rds_instances = self.rds.describe_db_instances()
                for instance in rds_instances['DBInstances']:
                    if instance.get('DBSubnetGroup', {}).get('VpcId') == vpc_id:
                        relationships.append({
                            'id': f"{vpc_id}-{instance['DBInstanceIdentifier']}",
                            'from_id': instance['DBInstanceIdentifier'],
                            'to_id': vpc_id,
                            'label': 'in_vpc'
                        })
            
            return relationships
        except Exception as e:
            logger.error(f"Error fetching AWS relationships: {e}")
            raise

    def _get_name_from_tags(self, tags: List[Dict[str, str]]) -> str:
        """Extract name from AWS resource tags"""
        for tag in tags:
            if tag['Key'].lower() == 'name':
                return tag['Value']
        return 'Unnamed'

class AzureProvider(CloudProvider):
    def __init__(self, tenant_id: str, client_id: str, client_secret: str):
        self.credentials = ClientSecretCredential(
            tenant_id=tenant_id,
            client_id=client_id,
            client_secret=client_secret
        )
        self.resource_client = ResourceManagementClient(
            credential=self.credentials,
            subscription_id=None  # Set this when needed
        )

    def get_resources(self) -> Dict[str, Any]:
        try:
            resources = {
                'nodes': [],
                'edges': []
            }
            
            # Get Azure resources
            for resource in self.resource_client.resources.list():
                resources['nodes'].append({
                    'id': resource.id,
                    'label': resource.name,
                    'group': resource.type,
                    'properties': resource.as_dict()
                })
            
            return resources
        except Exception as e:
            logger.error(f"Error fetching Azure resources: {e}")
            raise

    def get_resource_relationships(self) -> List[Dict[str, Any]]:
        # Implement Azure resource relationships
        return []

class GCPProvider(CloudProvider):
    def __init__(self, project_id: str, credentials_path: str):
        self.project_id = project_id
        self.client = resourcemanager.ProjectsClient.from_service_account_file(credentials_path)

    def get_resources(self) -> Dict[str, Any]:
        try:
            resources = {
                'nodes': [],
                'edges': []
            }
            
            # Get GCP resources
            project = self.client.get_project(name=f"projects/{self.project_id}")
            resources['nodes'].append({
                'id': project.name,
                'label': project.display_name,
                'group': 'project',
                'properties': project.to_dict()
            })
            
            return resources
        except Exception as e:
            logger.error(f"Error fetching GCP resources: {e}")
            raise

    def get_resource_relationships(self) -> List[Dict[str, Any]]:
        # Implement GCP resource relationships
        return []

def get_cloud_provider(provider: str, **kwargs) -> CloudProvider:
    """Factory function to get the appropriate cloud provider"""
    providers = {
        'aws': AWSProvider,
        'azure': AzureProvider,
        'gcp': GCPProvider
    }
    
    if provider.lower() not in providers:
        raise ValueError(f"Unsupported cloud provider: {provider}")
    
    return providers[provider.lower()](**kwargs) 