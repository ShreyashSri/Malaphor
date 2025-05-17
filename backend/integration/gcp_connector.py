import os
import json
import logging
from typing import Dict, List, Any, Optional
from google.cloud import asset_v1
from google.cloud import logging_v2
from google.cloud import monitoring_v3
from google.cloud import storage
from google.cloud import compute_v1
from google.cloud import iam_v1
from google.oauth2 import service_account
import time
import networkx as nx

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GCPConnector:
    """
    Connector for Google Cloud Platform.
    """
    
    def __init__(self, credentials_path=None, project_id=None):
        """
        Initialize the GCP connector.
        
        Args:
            credentials_path: Path to service account credentials JSON file
            project_id: GCP project ID
        """
        self.credentials_path = credentials_path
        self.project_id = project_id
        
        # Initialize credentials
        if credentials_path and os.path.exists(credentials_path):
            self.credentials = service_account.Credentials.from_service_account_file(credentials_path)
            logger.info(f"Loaded credentials from {credentials_path}")
        else:
            self.credentials = None
            logger.info("Using default credentials")
        
        # Initialize clients
        self.asset_client = None
        self.logging_client = None
        self.monitoring_client = None
        self.storage_client = None
        self.compute_client = None
        self.iam_client = None
    
    def initialize_clients(self):
        """
        Initialize GCP clients.
        """
        if self.credentials:
            self.asset_client = asset_v1.AssetServiceClient(credentials=self.credentials)
            self.logging_client = logging_v2.LoggingServiceV2Client(credentials=self.credentials)
            self.monitoring_client = monitoring_v3.MetricServiceClient(credentials=self.credentials)
            self.storage_client = storage.Client(credentials=self.credentials, project=self.project_id)
            self.compute_client = compute_v1.InstancesClient(credentials=self.credentials)
            self.iam_client = iam_v1.IAMClient(credentials=self.credentials)
        else:
            self.asset_client = asset_v1.AssetServiceClient()
            self.logging_client = logging_v2.LoggingServiceV2Client()
            self.monitoring_client = monitoring_v3.MetricServiceClient()
            self.storage_client = storage.Client(project=self.project_id)
            self.compute_client = compute_v1.InstancesClient()
            self.iam_client = iam_v1.IAMClient()
    
    def get_cloud_assets(self, asset_types=None):
        """
        Get cloud assets from GCP.
        
        Args:
            asset_types: List of asset types to include
            
        Returns:
            List of assets
        """
        if not self.asset_client:
            self.initialize_clients()
        
        # Define content type for the asset export
        content_type = asset_v1.ContentType.RESOURCE
        
        # Define request
        request = asset_v1.ListAssetsRequest(
            parent=f"projects/{self.project_id}",
            content_type=content_type,
            asset_types=asset_types
        )
        
        # Fetch assets
        assets = []
        try:
            for response in self.asset_client.list_assets(request=request):
                for asset in response.assets:
                    assets.append(asset)
            
            logger.info(f"Retrieved {len(assets)} assets from GCP")
        except Exception as e:
            logger.error(f"Failed to retrieve assets: {e}")
        
        return assets
    
    def get_cloud_logs(self, days=7, filter_str=None):
        """
        Get cloud logs from GCP.
        
        Args:
            days: Number of days of logs to retrieve
            filter_str: Filter string for logs
            
        Returns:
            List of log entries
        """
        if not self.logging_client:
            self.initialize_clients()
        
        # Set time range
        end_time = time.time()
        start_time = end_time - (days * 24 * 60 * 60)  # days in seconds
        
        # Construct filter
        if not filter_str:
            filter_str = f"""
            resource.type="gce_instance" OR 
            resource.type="gcs_bucket" OR 
            resource.type="cloudsql_database"
            timestamp >= "{start_time}" AND timestamp <= "{end_time}"
            """
        
        # List logs entries
        entries = []
        try:
            for page in self.logging_client.list_log_entries(
                resource_names=[f"projects/{self.project_id}"],
                filter=filter_str,
                order_by="timestamp desc"
            ):
                for entry in page:
                    entries.append(entry)
            
            logger.info(f"Retrieved {len(entries)} log entries from GCP")
        except Exception as e:
            logger.error(f"Failed to retrieve logs: {e}")
        
        return entries
    
    def build_cloud_graph(self, assets=None, logs=None):
        """
        Build a cloud resource graph from GCP assets and logs.
        
        Args:
            assets: List of assets (if None, will fetch)
            logs: List of log entries (if None, will fetch)
            
        Returns:
            Dictionary with 'nodes' and 'edges'
        """
        # Fetch assets if not provided
        if assets is None:
            assets = self.get_cloud_assets()
        
        # Fetch logs if not provided
        if logs is None:
            logs = self.get_cloud_logs()
        
        # Create graph nodes from assets
        nodes = []
        node_mapping = {}  # Maps asset name to node id
        
        for i, asset in enumerate(assets):
            asset_type = asset.asset_type.split('/')[-1]
            
            # Generate a node ID and map it to the asset name
            node_id = f"{asset_type.lower()}-{i+1}"
            node_mapping[asset.name] = node_id
            
            # Create node
            node = {
                "id": node_id,
                "label": asset.display_name if hasattr(asset, 'display_name') and asset.display_name else asset.name.split('/')[-1],
                "group": self._get_resource_group(asset_type)
            }
            nodes.append(node)
        
        # Create graph edges from relationships
        edges = self._create_edges_from_assets(assets, node_mapping)
        
        # Add edges from logs
        log_edges = self._create_edges_from_logs(logs, node_mapping)
        edges.extend(log_edges)
        
        # Combine to form the final graph
        graph = {
            "nodes": nodes,
            "edges": edges
        }
        
        return graph
    
    def _get_resource_group(self, asset_type):
        """
        Map GCP asset types to resource groups for visualization.
        
        Args:
            asset_type: GCP asset type
            
        Returns:
            Resource group category
        """
        compute_types = ['Instance', 'Disk', 'InstanceGroup', 'InstanceTemplate']
        storage_types = ['Bucket', 'Database', 'CloudSQL', 'Bigtable', 'Spanner']
        network_types = ['VPC', 'Subnet', 'Firewall', 'Route', 'LoadBalancer']
        identity_types = ['ServiceAccount', 'IAMRole', 'IAMBinding', 'User', 'Group']
        
        if any(ctype in asset_type for ctype in compute_types):
            return "compute"
        elif any(stype in asset_type for stype in storage_types):
            return "storage"
        elif any(ntype in asset_type for ntype in network_types):
            return "network"
        elif any(itype in asset_type for itype in identity_types):
            return "identity"
        else:
            return "other"
    
    def _create_edges_from_assets(self, assets, node_mapping):
        """
        Create edges based on relationships between assets.
        
        Args:
            assets: List of GCP assets
            node_mapping: Dictionary mapping asset names to node IDs
            
        Returns:
            List of edges
        """
        edges = []
        edge_id = 1
        
        # Process each asset to identify relationships
        for asset in assets:
            # Extract the node ID for this asset
            if asset.name not in node_mapping:
                continue
            
            source_id = node_mapping[asset.name]
            
            # Compute Engine instances to disks
            if asset.asset_type == "compute.googleapis.com/Instance":
                for disk in asset.resource.data.get("disks", []):
                    disk_name = disk.get("source")
                    if disk_name in node_mapping:
                        target_id = node_mapping[disk_name]
                        edges.append({
                            "id": f"e{edge_id}",
                            "from": source_id,
                            "to": target_id,
                            "label": "attached"
                        })
                        edge_id += 1
            
            # VPC to subnets
            elif asset.asset_type == "compute.googleapis.com/Network":
                for subnet in asset.resource.data.get("subnetworks", []):
                    if subnet in node_mapping:
                        target_id = node_mapping[subnet]
                        edges.append({
                            "id": f"e{edge_id}",
                            "from": source_id,
                            "to": target_id
                        })
                        edge_id += 1
            
            # IAM bindings
            elif asset.asset_type == "cloudresourcemanager.googleapis.com/Project":
                for binding in asset.iam_policy.bindings:
                    for member in binding.members:
                        # Extract the principal type and name
                        principal_type, principal_name = member.split(':')
                        
                        # Create an edge to the role
                        role_name = binding.role.split('/')[-1]
                        if role_name in node_mapping:
                            target_id = node_mapping[role_name]
                            edges.append({
                                "id": f"e{edge_id}",
                                "from": source_id,
                                "to": target_id,
                                "label": "grants"
                            })
                            edge_id += 1
        
        return edges
    
    def _create_edges_from_logs(self, logs, node_mapping):
        """
        Create edges based on access patterns in logs.
        
        Args:
            logs: List of log entries
            node_mapping: Dictionary mapping asset names to node IDs
            
        Returns:
            List of edges
        """
        edges = []
        edge_id = 1000  # Start from a high number to avoid conflicts
        
        # Track access patterns
        access_patterns = {}
        
        for entry in logs:
            # Extract the principal (user or service account)
            if hasattr(entry, 'principal') and entry.principal:
                principal = entry.principal
            elif hasattr(entry, 'auth_info') and entry.auth_info.principal_email:
                principal = entry.auth_info.principal_email
            else:
                principal = "unknown"
            
            # Extract the resource
            resource = entry.resource.type
            resource_name = entry.resource.labels.get('resource_name', '')
            
            # Skip if resource not in node mapping
            if resource_name not in node_mapping:
                continue
            
            # Extract the action
            if hasattr(entry, 'operation') and entry.operation.id:
                action = entry.operation.id
            else:
                action = "unknown"
            
            # Update access patterns
            key = (principal, resource_name)
            if key not in access_patterns:
                access_patterns[key] = {}
            
            if action not in access_patterns[key]:
                access_patterns[key][action] = 0
            
            access_patterns[key][action] += 1
        
        # Create edges for access patterns
        for (principal, resource_name), actions in access_patterns.items():
            # Skip if resource not in node mapping
            if resource_name not in node_mapping:
                continue
            
            # Get the most common action
            most_common_action = max(actions.items(), key=lambda x: x[1])[0]
            
            # Create edge
            target_id = node_mapping[resource_name]
            
            # Check if principal exists as a node
            principal_id = None
            for node_name, node_id in node_mapping.items():
                if principal in node_name:
                    principal_id = node_id
                    break
            
            if principal_id:
                edges.append({
                    "id": f"e{edge_id}",
                    "from": principal_id,
                    "to": target_id,
                    "label": most_common_action
                })
                edge_id += 1
        
        return edges
