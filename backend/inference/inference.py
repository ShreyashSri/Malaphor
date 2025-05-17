import os
import torch
import json
import numpy as np
from datetime import datetime

from backend.models.gnn_model import CloudSecurityGNN
from backend.data.graph_dataset import CloudResourceGraph

class CloudSecurityInference:
    """
    Inference class for cloud security GNN models.
    """
    
    def __init__(self, model_path, device=None):
        """
        Initialize the inference engine.
        
        Args:
            model_path: Path to the trained model
            device: Device to use for inference ('cuda' or 'cpu')
        """
        self.model_path = model_path
        self.device = device if device is not None else torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
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
        
        # Initialize model
        self.model = CloudSecurityGNN(
            num_node_features=self.config['num_node_features'],
            num_edge_features=self.config['num_edge_features'],
            hidden_channels=self.config['hidden_channels'],
            num_layers=self.config['num_layers'],
            dropout=self.config['dropout'],
            model_type=self.config['model_type']
        )
        
        # Load model weights
        self.model.load_state_dict(torch.load(model_path, map_location=self.device))
        self.model = self.model.to(self.device)
        self.model.eval()
        
        # Initialize graph processor
        self.graph_processor = CloudResourceGraph()
    
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
    
    def detect_anomalies(self, graph, threshold=0.5):
        """
        Detect anomalies in a graph.
        
        Args:
            graph: Dictionary with 'nodes' and 'edges'
            threshold: Anomaly score threshold
            
        Returns:
            List of detected anomalies
        """
        # Make predictions
        predictions = self.predict(graph)
        
        # Detect anomalies
        anomalies = []
        for i, node_id in enumerate(predictions['node_ids']):
            anomaly_score = predictions['anomaly_scores'][i]
            risk_score = predictions['risk_scores'][i]
            
            if anomaly_score > threshold:
                # Find connected nodes
                connected_nodes = []
                for edge in graph['edges']:
                    if edge['from'] == node_id:
                        connected_nodes.append(edge['to'])
                    elif edge['to'] == node_id:
                        connected_nodes.append(edge['from'])
                
                # Create anomaly
                anomaly = {
                    'id': f'anomaly-{len(anomalies) + 1}',
                    'node_id': node_id,
                    'node_label': predictions['node_labels'][i],
                    'node_type': predictions['node_types'][i],
                    'anomaly_score': anomaly_score,
                    'risk_score': risk_score,
                    'connected_nodes': connected_nodes,
                    'timestamp': datetime.now().isoformat(),
                    'severity': self._get_severity(anomaly_score)
                }
                
                anomalies.append(anomaly)
        
        return anomalies
    
    def _get_severity(self, score):
        """
        Get severity level based on score.
        
        Args:
            score: Anomaly or risk score
            
        Returns:
            Severity level ('low', 'medium', 'high', or 'critical')
        """
        if score > 0.9:
            return 'critical'
        elif score > 0.7:
            return 'high'
        elif score > 0.5:
            return 'medium'
        else:
            return 'low'
