from typing import Dict, List, Any
from .base_analyzer import SecurityAnalyzer
import logging

logger = logging.getLogger(__name__)

class NetworkAnalyzer(SecurityAnalyzer):
    """Analyzer for detecting network-related security issues."""
    
    # Common sensitive ports
    SENSITIVE_PORTS = {
        22: 'SSH',
        23: 'Telnet',
        3389: 'RDP',
        1433: 'MSSQL',
        3306: 'MySQL',
        5432: 'PostgreSQL',
        27017: 'MongoDB',
        6379: 'Redis',
        9200: 'Elasticsearch',
        5601: 'Kibana'
    }
    
    def analyze(self, graph_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Analyze network resources for security issues.
        
        Args:
            graph_data: Dictionary containing the cloud resource graph data
            
        Returns:
            List of security findings
        """
        self.clear_findings()
        
        # Analyze security groups
        if 'security_groups' in graph_data:
            for sg in graph_data['security_groups']:
                self._analyze_security_group(sg)
        
        # Analyze EC2 instances
        if 'ec2_instances' in graph_data:
            for instance in graph_data['ec2_instances']:
                self._analyze_ec2_instance(instance)
        
        # Analyze container services
        if 'ecs_services' in graph_data:
            for service in graph_data['ecs_services']:
                self._analyze_ecs_service(service)
        
        if 'eks_clusters' in graph_data:
            for cluster in graph_data['eks_clusters']:
                self._analyze_eks_cluster(cluster)
        
        return self.get_findings()
    
    def _analyze_security_group(self, sg: Dict[str, Any]) -> None:
        """Analyze a security group for security issues."""
        sg_id = sg.get('id')
        sg_name = sg.get('name')
        
        if 'rules' not in sg:
            return
            
        for rule in sg['rules']:
            # Check for public access
            if self._is_public_access(rule):
                port = rule.get('port', 'all')
                protocol = rule.get('protocol', 'all')
                
                self.add_finding(
                    resource_id=sg_id,
                    severity='high',
                    title='Public Access in Security Group',
                    description=f'Security group {sg_name} allows public access on {protocol} port {port}.',
                    recommendation='Restrict access to specific IP ranges or remove the rule if not needed.',
                    evidence={'rule': rule}
                )
            
            # Check for sensitive ports
            if self._is_sensitive_port(rule):
                port = rule.get('port')
                service = self.SENSITIVE_PORTS.get(port, 'Unknown')
                
                self.add_finding(
                    resource_id=sg_id,
                    severity='critical',
                    title=f'Exposed {service} Port',
                    description=f'Security group {sg_name} exposes {service} on port {port}.',
                    recommendation=f'Restrict access to {service} port {port} to specific IP ranges or remove if not needed.',
                    evidence={'rule': rule}
                )
    
    def _analyze_ec2_instance(self, instance: Dict[str, Any]) -> None:
        """Analyze an EC2 instance for security issues."""
        instance_id = instance.get('id')
        
        # Check if instance is in public subnet
        if instance.get('subnet', {}).get('is_public', False):
            self.add_finding(
                resource_id=instance_id,
                severity='medium',
                title='EC2 Instance in Public Subnet',
                description=f'EC2 instance {instance_id} is running in a public subnet.',
                recommendation='Consider moving the instance to a private subnet if it doesn\'t need public access.',
                evidence={'subnet': instance.get('subnet')}
            )
    
    def _analyze_ecs_service(self, service: Dict[str, Any]) -> None:
        """Analyze an ECS service for security issues."""
        service_id = service.get('id')
        
        # Check for privileged containers
        if service.get('task_definition', {}).get('privileged', False):
            self.add_finding(
                resource_id=service_id,
                severity='high',
                title='Privileged ECS Container',
                description=f'ECS service {service_id} is running with privileged mode enabled.',
                recommendation='Disable privileged mode unless absolutely necessary. Use specific capabilities instead.',
                evidence={'task_definition': service.get('task_definition')}
            )
    
    def _analyze_eks_cluster(self, cluster: Dict[str, Any]) -> None:
        """Analyze an EKS cluster for security issues."""
        cluster_id = cluster.get('id')
        
        # Check for missing pod security policies
        if not cluster.get('pod_security_policies'):
            self.add_finding(
                resource_id=cluster_id,
                severity='high',
                title='Missing Pod Security Policies',
                description=f'EKS cluster {cluster_id} does not have pod security policies configured.',
                recommendation='Implement pod security policies to enforce security best practices for pods.',
                evidence={'cluster_config': cluster}
            )
    
    def _is_public_access(self, rule: Dict[str, Any]) -> bool:
        """Check if a security group rule allows public access."""
        cidr = rule.get('cidr', '')
        return cidr == '0.0.0.0/0' or cidr == '::/0'
    
    def _is_sensitive_port(self, rule: Dict[str, Any]) -> bool:
        """Check if a security group rule exposes a sensitive port."""
        port = rule.get('port')
        return port in self.SENSITIVE_PORTS 