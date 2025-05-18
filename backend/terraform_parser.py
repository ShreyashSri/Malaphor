import hcl2
import networkx as nx
from typing import Dict, List

def parse_terraform(file_path: str) -> Dict:
    """Parse Terraform file and generate a resource graph"""
    with open(file_path, 'r') as f:
        tf_config = hcl2.load(f)
    
    nodes = []
    edges = []
    
    # Process resources
    for resource_type, resources in tf_config.get('resource', {}).items():
        for resource_name, config in resources.items():
            resource_id = f"{resource_type}.{resource_name}"
            nodes.append({
                'id': resource_id,
                'label': resource_name,
                'group': resource_type.split('_')[0],
                'type': 'terraform_resource'
            })
            
            # Process dependencies
            if 'depends_on' in config:
                for dep in config['depends_on']:
                    if isinstance(dep, str):
                        edges.append({
                            'from': dep,
                            'to': resource_id,
                            'label': 'depends_on'
                        })
    
    # Process modules
    for module_name, module_config in tf_config.get('module', {}).items():
        module_id = f"module.{module_name}"
        nodes.append({
            'id': module_id,
            'label': module_name,
            'group': 'module',
            'type': 'terraform_module'
        })
        
        # Add connections from module outputs to resources that use them
    
    return {
        'nodes': nodes,
        'edges': edges
    }