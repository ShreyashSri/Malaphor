import os
import json
import torch
import numpy as np
from torch_geometric.data import Data, Dataset, InMemoryDataset
from typing import List, Dict, Any, Optional, Union, Tuple
import networkx as nx
import pandas as pd
from sklearn.preprocessing import OneHotEncoder, StandardScaler

class CloudResourceGraph:
    """
    Class for processing cloud resource data into graph format.
    """
    
    def __init__(self, resource_types=None, relationship_types=None):
        """
        Initialize the graph processor.
        
        Args:
            resource_types: List of resource types to include
            relationship_types: List of relationship types to include
        """
        self.resource_types = resource_types
        self.relationship_types = relationship_types
        
        # Feature encoders
        self.node_type_encoder = None
        self.edge_type_encoder = None
        self.node_feature_scaler = None
        
        # Mappings
        self.node_type_mapping = {}
        self.edge_type_mapping = {}
    
    def fit_encoders(self, graphs: List[Dict[str, Any]]):
        """
        Fit feature encoders on a list of graphs.
        
        Args:
            graphs: List of graph dictionaries with 'nodes' and 'edges'
        """
        # Collect all node types
        node_types = set()
        for graph in graphs:
            for node in graph['nodes']:
                if 'group' in node:
                    node_types.add(node['group'])
        
        # Collect all edge types
        edge_types = set()
        for graph in graphs:
            for edge in graph['edges']:
                if 'label' in edge:
                    edge_types.add(edge['label'])
        
        # Create mappings
        self.node_type_mapping = {t: i for i, t in enumerate(sorted(node_types))}
        self.edge_type_mapping = {t: i for i, t in enumerate(sorted(edge_types))}
        
        # Create one-hot encoders
        self.node_type_encoder = OneHotEncoder(sparse=False, handle_unknown='ignore')
        self.node_type_encoder.fit(np.array(list(node_types)).reshape(-1, 1))
        
        self.edge_type_encoder = OneHotEncoder(sparse=False, handle_unknown='ignore')
        self.edge_type_encoder.fit(np.array(list(edge_types)).reshape(-1, 1))
        
        # Create feature scaler (for additional numerical features)
        self.node_feature_scaler = StandardScaler()
    
    def process_graph(self, graph: Dict[str, Any]) -> Data:
        """
        Process a graph dictionary into a PyTorch Geometric Data object.
        
        Args:
            graph: Dictionary with 'nodes' and 'edges'
            
        Returns:
            PyTorch Geometric Data object
        """
        # Create node ID mapping
        node_id_to_idx = {node['id']: i for i, node in enumerate(graph['nodes'])}
        
        # Process nodes
        num_nodes = len(graph['nodes'])
        
        # Create node features
        node_types = []
        for node in graph['nodes']:
            node_type = node.get('group', 'unknown')
            node_types.append(node_type)
        
        # One-hot encode node types
        node_type_features = np.zeros((num_nodes, len(self.node_type_mapping)))
        for i, node_type in enumerate(node_types):
            if node_type in self.node_type_mapping:
                node_type_features[i, self.node_type_mapping[node_type]] = 1.0
        
        # Additional node features could be added here
        # For now, we'll just use the node type features
        node_features = torch.tensor(node_type_features, dtype=torch.float)
        
        # Process edges
        edge_index = []
        edge_attr = []
        
        for edge in graph['edges']:
            # Skip edges with unknown nodes
            if edge['from'] not in node_id_to_idx or edge['to'] not in node_id_to_idx:
                continue
            
            # Add edge indices
            source_idx = node_id_to_idx[edge['from']]
            target_idx = node_id_to_idx[edge['to']]
            edge_index.append([source_idx, target_idx])
            
            # Process edge attributes
            edge_type = edge.get('label', 'unknown')
            edge_type_feature = np.zeros(len(self.edge_type_mapping))
            if edge_type in self.edge_type_mapping:
                edge_type_feature[self.edge_type_mapping[edge_type]] = 1.0
            
            edge_attr.append(edge_type_feature)
        
        # Convert to tensors
        if edge_index:
            edge_index = torch.tensor(edge_index, dtype=torch.long).t().contiguous()
            edge_attr = torch.tensor(edge_attr, dtype=torch.float)
        else:
            # Handle empty graphs
            edge_index = torch.zeros((2, 0), dtype=torch.long)
            edge_attr = torch.zeros((0, len(self.edge_type_mapping)), dtype=torch.float)
        
        # Create PyTorch Geometric Data object
        data = Data(
            x=node_features,
            edge_index=edge_index,
            edge_attr=edge_attr,
            num_nodes=num_nodes
        )
        
        # Add metadata
        data.node_ids = [node['id'] for node in graph['nodes']]
        data.node_labels = [node.get('label', '') for node in graph['nodes']]
        data.node_types = node_types
        
        return data

class CloudSecurityDataset(InMemoryDataset):
    """
    PyTorch Geometric dataset for cloud security graphs.
    """
    
    def __init__(self, root, graphs=None, transform=None, pre_transform=None, pre_filter=None):
        """
        Initialize the dataset.
        
        Args:
            root: Root directory where the dataset should be saved
            graphs: List of graph dictionaries (optional)
            transform: Transform to apply to the data
            pre_transform: Transform to apply to the data before saving
            pre_filter: Filter to apply to the data before saving
        """
        self.graphs = graphs
        super(CloudSecurityDataset, self).__init__(root, transform, pre_transform, pre_filter)
        self.data, self.slices = torch.load(self.processed_paths[0])
    
    @property
    def raw_file_names(self):
        return ['cloud_graphs.json']
    
    @property
    def processed_file_names(self):
        return ['data.pt']
    
    def download(self):
        # Save the input graphs to disk
        if self.graphs is not None:
            os.makedirs(self.raw_dir, exist_ok=True)
            with open(os.path.join(self.raw_dir, 'cloud_graphs.json'), 'w') as f:
                json.dump(self.graphs, f)
    
    def process(self):
        # Read the saved graphs
        with open(os.path.join(self.raw_dir, 'cloud_graphs.json'), 'r') as f:
            graphs = json.load(f)
        
        # Create graph processor
        processor = CloudResourceGraph()
        processor.fit_encoders(graphs)
        
        # Process each graph
        data_list = []
        for i, graph in enumerate(graphs):
            # Process graph
            data = processor.process_graph(graph)
            
            # Add graph-level labels (if available)
            if 'label' in graph:
                data.y = torch.tensor([graph['label']], dtype=torch.long)
            
            # Add node-level labels (if available)
            if 'node_labels' in graph:
                node_labels = []
                for node_id in data.node_ids:
                    if node_id in graph['node_labels']:
                        node_labels.append(graph['node_labels'][node_id])
                    else:
                        node_labels.append(0)  # Default label
                data.node_y = torch.tensor(node_labels, dtype=torch.long)
            
            # Apply pre-filter
            if self.pre_filter is not None and not self.pre_filter(data):
                continue
            
            # Apply pre-transform
            if self.pre_transform is not None:
                data = self.pre_transform(data)
            
            data_list.append(data)
        
        # Save the processed data
        data, slices = self.collate(data_list)
        torch.save((data, slices), self.processed_paths[0])

class CloudSecurityGraphGenerator:
    """
    Generator for synthetic cloud security graphs for training and testing.
    """
    
    def __init__(self, num_resource_types=5, num_relationship_types=10):
        """
        Initialize the generator.
        
        Args:
            num_resource_types: Number of resource types to generate
            num_relationship_types: Number of relationship types to generate
        """
        self.num_resource_types = num_resource_types
        self.num_relationship_types = num_relationship_types
        
        # Define resource types
        self.resource_types = [
            'compute', 'storage', 'network', 'identity', 'database',
            'container', 'serverless', 'monitoring', 'security', 'other'
        ][:num_resource_types]
        
        # Define relationship types
        self.relationship_types = [
            'contains', 'connects', 'accesses', 'reads', 'writes',
            'executes', 'manages', 'monitors', 'secures', 'depends_on',
            'trusts', 'authenticates', 'authorizes', 'logs', 'backs_up'
        ][:num_relationship_types]
        
        # Define anomaly patterns
        self.anomaly_patterns = [
            self._excessive_permissions_pattern,
            self._unusual_access_pattern,
            self._insecure_configuration_pattern,
            self._privilege_escalation_pattern,
            self._data_exfiltration_pattern
        ]
    
    def generate_graph(self, num_nodes=50, edge_probability=0.05, 
                       anomaly_probability=0.2, seed=None):
        """
        Generate a synthetic cloud resource graph.
        
        Args:
            num_nodes: Number of nodes to generate
            edge_probability: Probability of an edge between any two nodes
            anomaly_probability: Probability of introducing an anomaly
            seed: Random seed for reproducibility
            
        Returns:
            Dictionary with 'nodes', 'edges', and 'anomalies'
        """
        if seed is not None:
            np.random.seed(seed)
        
        # Generate nodes
        nodes = []
        for i in range(num_nodes):
            resource_type = np.random.choice(self.resource_types)
            node = {
                'id': f'node-{i}',
                'label': f'{resource_type}-{i}',
                'group': resource_type
            }
            nodes.append(node)
        
        # Generate edges
        edges = []
        edge_id = 0
        for i in range(num_nodes):
            for j in range(num_nodes):
                if i != j and np.random.random() < edge_probability:
                    relationship_type = np.random.choice(self.relationship_types)
                    edge = {
                        'id': f'edge-{edge_id}',
                        'from': f'node-{i}',
                        'to': f'node-{j}',
                        'label': relationship_type
                    }
                    edges.append(edge)
                    edge_id += 1
        
        # Generate anomalies
        anomalies = []
        if np.random.random() < anomaly_probability:
            # Choose a random anomaly pattern
            anomaly_pattern = np.random.choice(self.anomaly_patterns)
            anomaly_result = anomaly_pattern(nodes, edges)
            if anomaly_result:
                anomalies.append(anomaly_result)
        
        return {
            'nodes': nodes,
            'edges': edges,
            'anomalies': anomalies,
            'node_labels': self._generate_node_labels(nodes, edges, anomalies)
        }
    
    def generate_dataset(self, num_graphs=100, min_nodes=20, max_nodes=100, 
                         edge_probability=0.05, anomaly_probability=0.2, seed=None):
        """
        Generate a dataset of synthetic cloud resource graphs.
        
        Args:
            num_graphs: Number of graphs to generate
            min_nodes: Minimum number of nodes per graph
            max_nodes: Maximum number of nodes per graph
            edge_probability: Probability of an edge between any two nodes
            anomaly_probability: Probability of introducing an anomaly
            seed: Random seed for reproducibility
            
        Returns:
            List of graph dictionaries
        """
        if seed is not None:
            np.random.seed(seed)
        
        graphs = []
        for i in range(num_graphs):
            num_nodes = np.random.randint(min_nodes, max_nodes + 1)
            graph = self.generate_graph(
                num_nodes=num_nodes,
                edge_probability=edge_probability,
                anomaly_probability=anomaly_probability,
                seed=seed + i if seed is not None else None
            )
            
            # Add graph-level label (1 if anomalies exist, 0 otherwise)
            graph['label'] = 1 if graph['anomalies'] else 0
            
            graphs.append(graph)
        
        return graphs
    
    def _generate_node_labels(self, nodes, edges, anomalies):
        """
        Generate node-level labels based on anomalies.
        
        Args:
            nodes: List of node dictionaries
            edges: List of edge dictionaries
            anomalies: List of anomaly dictionaries
            
        Returns:
            Dictionary mapping node IDs to labels (1 for anomalous, 0 for normal)
        """
        node_labels = {node['id']: 0 for node in nodes}
        
        for anomaly in anomalies:
            if 'affected_nodes' in anomaly:
                for node_id in anomaly['affected_nodes']:
                    node_labels[node_id] = 1
        
        return node_labels
    
    def _excessive_permissions_pattern(self, nodes, edges):
        """
        Generate an excessive permissions anomaly pattern.
        
        Args:
            nodes: List of node dictionaries
            edges: List of edge dictionaries
            
        Returns:
            Anomaly dictionary or None
        """
        # Find identity nodes
        identity_nodes = [node for node in nodes if node['group'] == 'identity']
        if not identity_nodes:
            return None
        
        # Choose a random identity node
        identity_node = np.random.choice(identity_nodes)
        
        # Add excessive permission edges
        affected_nodes = [identity_node['id']]
        new_edges = []
        
        # Find sensitive resource nodes
        sensitive_nodes = [node for node in nodes if node['group'] in ['database', 'storage']]
        if not sensitive_nodes:
            return None
        
        # Add excessive permissions to sensitive resources
        for sensitive_node in sensitive_nodes[:min(5, len(sensitive_nodes))]:
            edge_id = f'anomaly-edge-{len(edges) + len(new_edges)}'
            edge = {
                'id': edge_id,
                'from': identity_node['id'],
                'to': sensitive_node['id'],
                'label': 'writes'  # Excessive permission
            }
            new_edges.append(edge)
            affected_nodes.append(sensitive_node['id'])
        
        # Add the new edges to the graph
        edges.extend(new_edges)
        
        return {
            'type': 'excessive_permissions',
            'description': 'Identity has excessive permissions to sensitive resources',
            'affected_nodes': affected_nodes,
            'severity': 'high'
        }
    
    def _unusual_access_pattern(self, nodes, edges):
        """
        Generate an unusual access pattern anomaly.
        
        Args:
            nodes: List of node dictionaries
            edges: List of edge dictionaries
            
        Returns:
            Anomaly dictionary or None
        """
        # Find compute nodes
        compute_nodes = [node for node in nodes if node['group'] == 'compute']
        if len(compute_nodes) < 2:
            return None
        
        # Choose two random compute nodes
        source_node = np.random.choice(compute_nodes)
        target_nodes = [node for node in compute_nodes if node['id'] != source_node['id']]
        target_node = np.random.choice(target_nodes)
        
        # Add unusual access edge
        edge_id = f'anomaly-edge-{len(edges)}'
        edge = {
            'id': edge_id,
            'from': source_node['id'],
            'to': target_node['id'],
            'label': 'executes'  # Unusual access
        }
        edges.append(edge)
        
        return {
            'type': 'unusual_access',
            'description': 'Compute instance accessing another compute instance in an unusual way',
            'affected_nodes': [source_node['id'], target_node['id']],
            'severity': 'medium'
        }
    
    def _insecure_configuration_pattern(self, nodes, edges):
        """
        Generate an insecure configuration anomaly pattern.
        
        Args:
            nodes: List of node dictionaries
            edges: List of edge dictionaries
            
        Returns:
            Anomaly dictionary or None
        """
        # Find storage nodes
        storage_nodes = [node for node in nodes if node['group'] == 'storage']
        if not storage_nodes:
            return None
        
        # Choose a random storage node
        storage_node = np.random.choice(storage_nodes)
        
        # Add public access edge
        edge_id = f'anomaly-edge-{len(edges)}'
        public_node_id = 'public-internet'
        
        # Add public internet node if it doesn't exist
        public_node_exists = any(node['id'] == public_node_id for node in nodes)
        if not public_node_exists:
            public_node = {
                'id': public_node_id,
                'label': 'Public Internet',
                'group': 'network'
            }
            nodes.append(public_node)
        
        edge = {
            'id': edge_id,
            'from': public_node_id,
            'to': storage_node['id'],
            'label': 'reads'  # Public access
        }
        edges.append(edge)
        
        return {
            'type': 'insecure_configuration',
            'description': 'Storage resource is publicly accessible',
            'affected_nodes': [storage_node['id']],
            'severity': 'critical'
        }
    
    def _privilege_escalation_pattern(self, nodes, edges):
        """
        Generate a privilege escalation anomaly pattern.
        
        Args:
            nodes: List of node dictionaries
            edges: List of edge dictionaries
            
        Returns:
            Anomaly dictionary or None
        """
        # Find identity nodes
        identity_nodes = [node for node in nodes if node['group'] == 'identity']
        if len(identity_nodes) < 2:
            return None
        
        # Choose two random identity nodes
        low_priv_node = np.random.choice(identity_nodes)
        high_priv_nodes = [node for node in identity_nodes if node['id'] != low_priv_node['id']]
        high_priv_node = np.random.choice(high_priv_nodes)
        
        # Add privilege escalation path
        new_edges = []
        edge_id = f'anomaly-edge-{len(edges)}'
        
        # Find an intermediate node
        intermediate_nodes = [node for node in nodes if node['group'] not in ['identity']]
        if not intermediate_nodes:
            return None
        
        intermediate_node = np.random.choice(intermediate_nodes)
        
        # Create escalation path
        edge1 = {
            'id': edge_id,
            'from': low_priv_node['id'],
            'to': intermediate_node['id'],
            'label': 'writes'
        }
        
        edge2 = {
            'id': f'{edge_id}-2',
            'from': intermediate_node['id'],
            'to': high_priv_node['id'],
            'label': 'trusts'
        }
        
        new_edges.extend([edge1, edge2])
        edges.extend(new_edges)
        
        return {
            'type': 'privilege_escalation',
            'description': 'Potential privilege escalation path detected',
            'affected_nodes': [low_priv_node['id'], intermediate_node['id'], high_priv_node['id']],
            'severity': 'critical'
        }
    
    def _data_exfiltration_pattern(self, nodes, edges):
        """
        Generate a data exfiltration anomaly pattern.
        
        Args:
            nodes: List of node dictionaries
            edges: List of edge dictionaries
            
        Returns:
            Anomaly dictionary or None
        """
        # Find storage and compute nodes
        storage_nodes = [node for node in nodes if node['group'] in ['storage', 'database']]
        compute_nodes = [node for node in nodes if node['group'] == 'compute']
        
        if not storage_nodes or not compute_nodes:
            return None
        
        # Choose random nodes
        storage_node = np.random.choice(storage_nodes)
        compute_node = np.random.choice(compute_nodes)
        
        # Add external node if it doesn't exist
        external_node_id = 'external-endpoint'
        external_node_exists = any(node['id'] == external_node_id for node in nodes)
        
        if not external_node_exists:
            external_node = {
                'id': external_node_id,
                'label': 'External Endpoint',
                'group': 'network'
            }
            nodes.append(external_node)
        
        # Create exfiltration path
        new_edges = []
        
        # Compute reads from storage
        edge1 = {
            'id': f'anomaly-edge-{len(edges)}',
            'from': compute_node['id'],
            'to': storage_node['id'],
            'label': 'reads'
        }
        
        # Compute writes to external
        edge2 = {
            'id': f'anomaly-edge-{len(edges) + 1}',
            'from': compute_node['id'],
            'to': external_node_id,
            'label': 'writes'
        }
        
        new_edges.extend([edge1, edge2])
        edges.extend(new_edges)
        
        return {
            'type': 'data_exfiltration',
            'description': 'Potential data exfiltration path detected',
            'affected_nodes': [compute_node['id'], storage_node['id'], external_node_id],
            'severity': 'critical'
        }
