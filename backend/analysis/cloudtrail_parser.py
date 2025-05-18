import json

class CloudTrailParser:
    """Parser for AWS CloudTrail logs"""
    
    def __init__(self):
        self.ec2_instances = []
        self.s3_buckets = []
        self.security_groups = []
        self.iam_roles = []
        
    def parse(self, logs: str) -> dict:
        """Parse CloudTrail logs and extract relevant information"""
        try:
            # Parse the JSON string
            data = json.loads(logs)
            
            # Process each record in the CloudTrail log
            for record in data.get('Records', []):
                self._process_record(record)
            
            # Return the parsed data in our expected format
            return {
                's3_buckets': self.s3_buckets,
                'security_groups': self.security_groups,
                'ec2_instances': self.ec2_instances,
                'iam_roles': self.iam_roles
            }
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON format: {str(e)}")
        except Exception as e:
            raise ValueError(f"Error parsing CloudTrail logs: {str(e)}")
    
    def _process_record(self, record: dict):
        """Process a single CloudTrail record"""
        event_name = record.get('eventName', '')
        event_source = record.get('eventSource', '')
        
        # Process EC2 related events
        if event_source == 'ec2.amazonaws.com':
            if event_name == 'DescribeInstances':
                self._process_ec2_instances(record)
            elif event_name == 'DescribeSecurityGroups':
                self._process_security_groups(record)
                
        # Process S3 related events
        elif event_source == 's3.amazonaws.com':
            if event_name == 'ListBuckets':
                self._process_s3_buckets(record)
                
        # Process IAM related events
        elif event_source == 'iam.amazonaws.com':
            if event_name == 'ListRoles':
                self._process_iam_roles(record)
    
    def _process_ec2_instances(self, record: dict):
        """Process EC2 instance information"""
        try:
            response_elements = record.get('responseElements', {})
            if not response_elements:
                return
                
            instances = response_elements.get('reservationSet', [])
            for reservation in instances:
                for instance in reservation.get('instancesSet', []):
                    instance_info = {
                        'id': instance.get('instanceId', ''),
                        'type': instance.get('instanceType', ''),
                        'state': instance.get('state', {}).get('name', ''),
                        'public_ip': instance.get('ipAddress', ''),
                        'private_ip': instance.get('privateIpAddress', ''),
                        'vpc_id': instance.get('vpcId', ''),
                        'subnet_id': instance.get('subnetId', ''),
                        'security_groups': [
                            {
                                'id': sg.get('groupId', ''),
                                'name': sg.get('groupName', '')
                            }
                            for sg in instance.get('groupSet', [])
                        ]
                    }
                    self.ec2_instances.append(instance_info)
        except Exception as e:
            print(f"Error processing EC2 instances: {str(e)}")
    
    def _process_security_groups(self, record: dict):
        """Process security group information"""
        try:
            response_elements = record.get('responseElements', {})
            if not response_elements:
                return
                
            security_groups = response_elements.get('securityGroupInfo', {}).get('item', [])
            for sg in security_groups:
                sg_info = {
                    'id': sg.get('groupId', ''),
                    'name': sg.get('groupName', ''),
                    'description': sg.get('groupDescription', ''),
                    'vpc_id': sg.get('vpcId', ''),
                    'inbound_rules': [
                        {
                            'protocol': rule.get('ipProtocol', ''),
                            'from_port': rule.get('fromPort', ''),
                            'to_port': rule.get('toPort', ''),
                            'cidr': [ip_range.get('cidrIp', '') for ip_range in rule.get('ipRanges', [])]
                        }
                        for rule in sg.get('ipPermissions', [])
                    ],
                    'outbound_rules': [
                        {
                            'protocol': rule.get('ipProtocol', ''),
                            'from_port': rule.get('fromPort', ''),
                            'to_port': rule.get('toPort', ''),
                            'cidr': [ip_range.get('cidrIp', '') for ip_range in rule.get('ipRanges', [])]
                        }
                        for rule in sg.get('ipPermissionsEgress', [])
                    ]
                }
                self.security_groups.append(sg_info)
        except Exception as e:
            print(f"Error processing security groups: {str(e)}")
    
    def _process_s3_buckets(self, record: dict):
        """Process S3 bucket information"""
        try:
            response_elements = record.get('responseElements', {})
            if not response_elements:
                return
                
            buckets = response_elements.get('buckets', {}).get('item', [])
            for bucket in buckets:
                bucket_info = {
                    'name': bucket.get('name', ''),
                    'creation_date': bucket.get('creationDate', ''),
                    'owner': bucket.get('owner', {}).get('displayName', ''),
                    'region': record.get('awsRegion', '')
                }
                self.s3_buckets.append(bucket_info)
        except Exception as e:
            print(f"Error processing S3 buckets: {str(e)}")
    
    def _process_iam_roles(self, record: dict):
        """Process IAM role information"""
        try:
            response_elements = record.get('responseElements', {})
            if not response_elements:
                return
                
            roles = response_elements.get('roles', {}).get('member', [])
            for role in roles:
                role_info = {
                    'name': role.get('roleName', ''),
                    'arn': role.get('arn', ''),
                    'create_date': role.get('createDate', ''),
                    'description': role.get('description', ''),
                    'max_session_duration': role.get('maxSessionDuration', ''),
                    'path': role.get('path', ''),
                    'assume_role_policy': role.get('assumeRolePolicyDocument', '')
                }
                self.iam_roles.append(role_info)
        except Exception as e:
            print(f"Error processing IAM roles: {str(e)}") 