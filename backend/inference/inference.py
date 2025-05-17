import os
import torch
import json
import numpy as np
from datetime import datetime
import torch_geometric
from typing import Dict, Any, List
import logging
import uuid

from models.gnn_model import CloudSecurityGNN
from data.graph_dataset import CloudResourceGraph

logger = logging.getLogger(__name__)

class CloudSecurityInference:
    """
    Inference class for cloud security GNN models.
    """
    
    def __init__(self, model_path: str, threshold: float = 0.7):
        """
        Initialize the inference engine.
        
        Args:
            model_path: Path to the trained model
            threshold: Anomaly score threshold
        """
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.threshold = threshold
        self.model = self._load_model(model_path)
        logger.info(f"Model loaded from {model_path}")
        
        # Load model configuration
        model_dir = os.path.dirname(model_path)
        config_path = os.path.join(model_dir, 'model_config.json')
        
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                self.config = json.load(f)
        else:
            # Default configuration
            self.config = {
                'num_node_features': 5,
                'num_edge_features': 0,
                'hidden_channels': 64,
                'num_layers': 3,
                'dropout': 0.2,
                'model_type': 'gat'
            }
        
        # Initialize graph processor
        self.graph_processor = CloudResourceGraph()
    
    def _load_model(self, model_path: str) -> torch.nn.Module:
        """Load the trained GNN model"""
        try:
            model = torch.load(model_path, map_location=self.device)
            model.eval()
            return model
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise

    def _prepare_graph_data(self, graph: Dict[str, Any]) -> torch_geometric.data.Data:
        """Convert graph data to PyTorch Geometric format"""
        try:
            # Convert nodes to features
            node_features = []
            node_mapping = {}
            
            for i, node in enumerate(graph['nodes']):
                node_mapping[node['id']] = i
                # Extract relevant features from node properties
                features = self._extract_node_features(node)
                node_features.append(features)
            
            # Convert edges to edge_index
            edge_index = []
            edge_attr = []
            
            for edge in graph['edges']:
                if edge['from_id'] in node_mapping and edge['to_id'] in node_mapping:
                    edge_index.append([node_mapping[edge['from_id']], node_mapping[edge['to_id']]])
                    # Extract edge features if available
                    edge_features = self._extract_edge_features(edge)
                    edge_attr.append(edge_features)
            
            # Convert to tensors
            x = torch.tensor(node_features, dtype=torch.float)
            edge_index = torch.tensor(edge_index, dtype=torch.long).t().contiguous()
            edge_attr = torch.tensor(edge_attr, dtype=torch.float) if edge_attr else None
            
            return torch_geometric.data.Data(x=x, edge_index=edge_index, edge_attr=edge_attr)
        except Exception as e:
            logger.error(f"Error preparing graph data: {e}")
            raise

    def _extract_node_features(self, node: Dict[str, Any]) -> List[float]:
        """Extract relevant features from node properties"""
        # This is a placeholder - implement based on your model's requirements
        features = []
        properties = node.get('properties', {})
        
        # Example feature extraction
        if node['group'] == 'ec2':
            features.extend([
                float(properties.get('State', {}).get('Code', 0)),
                float(properties.get('InstanceType', 't2.micro').split('.')[-1]),
                float(len(properties.get('SecurityGroups', []))),
            ])
        elif node['group'] == 'iam_user':
            features.extend([
                float(len(properties.get('AttachedPolicies', []))),
                float(properties.get('PasswordLastUsed', 0) is not None),
            ])
        
        # Pad or truncate to fixed size
        return features + [0.0] * (10 - len(features))  # Assuming 10 features

    def _extract_edge_features(self, edge: Dict[str, Any]) -> List[float]:
        """Extract relevant features from edge properties"""
        # This is a placeholder - implement based on your model's requirements
        return [1.0]  # Simple binary feature

    def process_graph(self, graph):
        """
        Process a graph for inference.
        
        Args:
            graph: Dictionary with 'nodes' and 'edges'
            
        Returns:
            PyTorch Geometric Data object
        """
        # Fit encoders if not already fit
        if self.graph_processor.node_type_encoder is None:
            self.graph_processor.fit_encoders([graph])
        
        # Process graph
        return self.graph_processor.process_graph(graph)
    
    def predict(self, graph):
        """
        Make predictions on a graph.
        
        Args:
            graph: Dictionary with 'nodes' and 'edges'
            
        Returns:
            Dictionary of predictions
        """
        # Process graph
        data = self.process_graph(graph)
        
        # Move data to device
        data = data.to(self.device)
        
        # Forward pass
        with torch.no_grad():
            node_embeddings, anomaly_scores, risk_scores, resource_type_logits, graph_logits = self.model(
                data.x, data.edge_index, data.edge_attr, data.batch if hasattr(data, 'batch') else None)
        
        # Convert predictions to numpy
        anomaly_scores = anomaly_scores.view(-1).cpu().numpy()
        risk_scores = risk_scores.view(-1).cpu().numpy()
        resource_type_logits = torch.softmax(resource_type_logits, dim=1).cpu().numpy()
        
        # Graph-level predictions (if available)
        if graph_logits is not None:
            graph_logits = torch.softmax(graph_logits, dim=1).cpu().numpy()
        
        # Create predictions dictionary
        predictions = {
            'node_ids': data.node_ids,
            'node_labels': data.node_labels,
            'node_types': data.node_types,
            'anomaly_scores': anomaly_scores.tolist(),
            'risk_scores': risk_scores.tolist(),
            'resource_type_probs': resource_type_logits.tolist(),
        }
        
        if graph_logits is not None:
            predictions['graph_probs'] = graph_logits.tolist()
        
        return predictions
    
    def detect_anomalies(self, graph: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Detect anomalies in the cloud resource graph"""
        try:
            # Prepare graph data
            data = self._prepare_graph_data(graph)
            data = data.to(self.device)
            
            # Run inference
            with torch.no_grad():
                predictions = self.model(data)
            
            # Process predictions
            anomalies = []
            for i, (node, pred) in enumerate(zip(graph['nodes'], predictions)):
                if pred > self.threshold:
                    anomaly = {
                        'id': str(uuid.uuid4()),
                        'node_id': node['id'],
                        'node_type': node['group'],
                        'node_label': node['label'],
                        'severity': self._determine_severity(pred),
                        'confidence_score': float(pred),
                        'timestamp': datetime.utcnow().isoformat(),
                        'connected_nodes': self._get_connected_nodes(node['id'], graph['edges'])
                    }
                    anomalies.append(anomaly)
            
            return anomalies
        except Exception as e:
            logger.error(f"Error detecting anomalies: {e}")
            raise

    def _determine_severity(self, confidence: float) -> str:
        """Determine anomaly severity based on confidence score"""
        if confidence > 0.9:
            return 'critical'
        elif confidence > 0.8:
            return 'high'
        elif confidence > 0.7:
            return 'medium'
        else:
            return 'low'

    def _get_connected_nodes(self, node_id: str, edges: List[Dict[str, Any]]) -> List[str]:
        """Get IDs of nodes connected to the given node"""
        connected = []
        for edge in edges:
            if edge['from_id'] == node_id:
                connected.append(edge['to_id'])
            elif edge['to_id'] == node_id:
                connected.append(edge['from_id'])
        return connected
