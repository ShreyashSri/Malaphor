# This file would handle data ingestion from cloud providers
from typing import Dict, List, Any, Optional
import google.auth
from google.cloud import asset_v1
from google.cloud import monitoring_v3
from google.cloud import logging_v2
import json
import time
import networkx as nx

def ingest_gcp_assets(project_id: str) -> Dict[str, Any]:
    """
    Ingest cloud resource data from Google Cloud Platform
    
    Args:
        project_id: GCP project ID
        
    Returns:
        Dictionary containing nodes and edges of the cloud resource graph
    """
    # Initialize asset service client
    client = asset_v1.AssetServiceClient()
    
    # Define content type for the asset export
    content_type = asset_v1.ContentType.RESOURCE
    
    # Define request
    request = asset_v1.ListAssetsRequest(
        parent=f"projects/{project_id}",
        content_type=content_type,
    )
    
    # Fetch assets
    assets = []
    for response in client.list_assets(request=request):
        for asset in response.assets:
            assets.append(asset)
    
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
            "group": get_resource_group(asset_type)
        }
        nodes.append(node)
    
    # Create graph edges from relationships
    edges = create_edges_from_assets(assets, node_mapping)
    
    # Combine to form the final graph
    graph = {
        "nodes": nodes,
        "edges": edges
    }
    
    return graph

def get_resource_group(asset_type: str) -> str:
    """
    Map GCP asset types to resource groups for visualization
    
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

def create_edges_from_assets(assets, node_mapping):
    """
    Create edges based on relationships between assets
    
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
    
    # Add additional edges based on common security patterns and relationships
    network_graph = build_network_graph(assets, node_mapping)
    for edge in network_graph:
        edges.append({
            "id": f"e{edge_id}",
            "from": edge["from"],
            "to": edge["to"],
            "label": edge.get("label", "connects")
        })
        edge_id += 1
    
    return edges

def build_network_graph(assets, node_mapping):
    """
    Build a network connectivity graph based on VPC, firewalls, and instances
    
    Args:
        assets: List of GCP assets
        node_mapping: Dictionary mapping asset names to node IDs
        
    Returns:
        List of network connectivity edges
    """
    # Create a NetworkX graph for analysis
    G = nx.DiGraph()
    
    # Add nodes for VPCs, subnets, and instances
    vpcs = {}
    subnets = {}
    instances = {}
    
    for asset in assets:
        if asset.name not in node_mapping:
            continue
            
        node_id = node_mapping[asset.name]
        
        if asset.asset_type == "compute.googleapis.com/Network":
            vpcs[asset.name] = node_id
            G.add_node(node_id, type="vpc")
            
        elif asset.asset_type == "compute.googleapis.com/Subnetwork":
            vpc_network = asset.resource.data.get("network")
            subnets[asset.name] = {
                "id": node_id,
                "vpc": vpc_network
            }
            G.add_node(node_id, type="subnet")
            
        elif asset.asset_type == "compute.googleapis.com/Instance":
            network_interfaces = asset.resource.data.get("networkInterfaces", [])
            if network_interfaces:
                subnet = network_interfaces[0].get("subnetwork")
                instances[asset.name] = {
                    "id": node_id,
                    "subnet": subnet
                }
                G.add_node(node_id, type="instance")
    
    # Connect subnets to VPCs
    for subnet_name, subnet_data in subnets.items():
        vpc_name = subnet_data["vpc"]
        if vpc_name in vpcs:
            G.add_edge(vpcs[vpc_name], subnet_data["id"], type="contains")
    
    # Connect instances to subnets
    for instance_name, instance_data in instances.items():
        subnet_name = instance_data["subnet"]
        if subnet_name in subnets:
            G.add_edge(subnets[subnet_name]["id"], instance_data["id"], type="contains")
    
    # Extract edges from the NetworkX graph
    network_edges = []
    for u, v, data in G.edges(data=True):
        network_edges.append({
            "from": u,
            "to": v,
            "label": data.get("type", "connects")
        })
    
    return network_edges

def ingest_cloud_logs(project_id, days=7):
    """
    Ingest and analyze cloud logs for activity patterns
    
    Args:
        project_id: GCP project ID
        days: Number of days of logs to analyze
        
    Returns:
        Dictionary with access patterns and potential anomalies
    """
    # Initialize logging client
    client = logging_v2.LoggingServiceV2Client()
    
    # Set time range
    end_time = time.time()
    start_time = end_time - (days * 24 * 60 * 60)  # days in seconds
    
    # Construct filter for audit logs
    filter_str = f"""
    resource.type="gce_instance" OR 
    resource.type="gcs_bucket" OR 
    resource.type="cloudsql_database"
    timestamp >= "{start_time}" AND timestamp <= "{end_time}"
    """
    
    # List logs entries
    entries = []
    for page in client.list_log_entries(
        resource_names=[f"projects/{project_id}"],
        filter=filter_str,
        order_by="timestamp desc"
    ):
        for entry in page:
            entries.append(entry)
    
    # Process log entries to extract patterns and potential anomalies
    access_patterns = analyze_log_entries(entries)
    
    return access_patterns

def analyze_log_entries(entries):
    """
    Analyze log entries to extract access patterns and potential anomalies
    
    Args:
        entries: List of log entries
        
    Returns:
        Dictionary with access patterns and potential anomalies
    """
    # In a real implementation, this would involve more sophisticated analysis
    # For this prototype, we'll do basic counting and pattern recognition
    
    # Count actions by principal
    principal_actions = {}
    resource_accesses = {}
    
    for entry in entries:
        # Extract the principal (user or service account)
        if hasattr(entry, 'principal') and entry.principal:
            principal = entry.principal
        elif hasattr(entry, 'auth_info') and entry.auth_info.principal_email:
            principal = entry.auth_info.principal_email
        else:
            principal = "unknown"
        
        # Extract the resource and action
        resource = entry.resource.type
        if hasattr(entry, 'operation') and entry.operation.id:
            action = entry.operation.id
        else:
            action = "unknown"
        
        # Update principal actions count
        if principal not in principal_actions:
            principal_actions[principal] = {}
        
        if action not in principal_actions[principal]:
            principal_actions[principal][action] = 0
        
        principal_actions[principal][action] += 1
        
        # Update resource accesses
        if resource not in resource_accesses:
            resource_accesses[resource] = {}
        
        if principal not in resource_accesses[resource]:
            resource_accesses[resource][principal] = 0
        
        resource_accesses[resource][principal] += 1
    
    # Identify potential anomalies based on access patterns
    anomalies = []
    
    # Identify principals with unusual access patterns
    for principal, actions in principal_actions.items():
        # Check for principals with many different types of actions
        if len(actions) > 10:
            anomalies.append({
                "type": "PRINCIPAL_MANY_ACTIONS",
                "principal": principal,
                "action_count": len(actions),
                "severity": "medium"
            })
    
    # Identify resources accessed by many principals
    for resource, principals in resource_accesses.items():
        if len(principals) > 20:
            anomalies.append({
                "type": "RESOURCE_MANY_ACCESSORS",
                "resource": resource,
                "accessor_count": len(principals),
                "severity": "medium"
            })
    
    return {
        "principal_actions": principal_actions,
        "resource_accesses": resource_accesses,
        "potential_anomalies": anomalies
    }

# For local testing
if __name__ == "__main__":
    # Replace with your GCP project ID
    PROJECT_ID = "your-project-id"
    
    # Ingest cloud assets
    print("Ingesting cloud assets...")
    graph = ingest_gcp_assets(PROJECT_ID)
    
    # Save to file for inspection
    with open("cloud_graph.json", "w") as f:
        json.dump(graph, f, indent=2)
    
    print(f"Created graph with {len(graph['nodes'])} nodes and {len(graph['edges'])} edges")
    
    # Ingest and analyze logs
    print("Ingesting and analyzing logs...")
    access_patterns = ingest_cloud_logs(PROJECT_ID)
    
    # Save to file for inspection
    with open("access_patterns.json", "w") as f:
        json.dump(access_patterns, f, indent=2)
    
    print(f"Analyzed logs and found {len(access_patterns['potential_anomalies'])} potential anomalies")
