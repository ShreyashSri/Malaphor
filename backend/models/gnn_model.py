import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GCNConv, GATConv, SAGEConv, global_mean_pool
from torch_geometric.data import Data, Batch

class CloudSecurityGNN(nn.Module):
    """
    Graph Neural Network for cloud security anomaly detection.
    
    This model uses a combination of graph convolutional layers to learn
    representations of cloud resources and their relationships, then
    performs anomaly detection and risk scoring.
    """
    
    def __init__(self, num_node_features, num_edge_features=0, hidden_channels=64, 
                 num_layers=3, dropout=0.2, model_type="gat"):
        """
        Initialize the GNN model.
        
        Args:
            num_node_features: Number of input node features
            num_edge_features: Number of edge features (if any)
            hidden_channels: Size of hidden layers
            num_layers: Number of graph convolutional layers
            dropout: Dropout probability
            model_type: Type of GNN layer to use ('gcn', 'gat', or 'sage')
        """
        super(CloudSecurityGNN, self).__init__()
        
        self.num_layers = num_layers
        self.dropout = dropout
        self.model_type = model_type
        
        # Input layer
        if model_type == "gcn":
            self.conv_layers = nn.ModuleList([GCNConv(num_node_features, hidden_channels)])
        elif model_type == "gat":
            self.conv_layers = nn.ModuleList([GATConv(num_node_features, hidden_channels, heads=4, concat=False)])
        elif model_type == "sage":
            self.conv_layers = nn.ModuleList([SAGEConv(num_node_features, hidden_channels)])
        else:
            raise ValueError(f"Unknown model type: {model_type}")
        
        # Hidden layers
        for _ in range(num_layers - 1):
            if model_type == "gcn":
                self.conv_layers.append(GCNConv(hidden_channels, hidden_channels))
            elif model_type == "gat":
                self.conv_layers.append(GATConv(hidden_channels, hidden_channels, heads=4, concat=False))
            elif model_type == "sage":
                self.conv_layers.append(SAGEConv(hidden_channels, hidden_channels))
        
        # Anomaly detection layers
        self.anomaly_fc1 = nn.Linear(hidden_channels, 32)
        self.anomaly_fc2 = nn.Linear(32, 1)
        
        # Risk scoring layers
        self.risk_fc1 = nn.Linear(hidden_channels, 32)
        self.risk_fc2 = nn.Linear(32, 1)
        
        # Resource classification layers (for resource type prediction)
        self.resource_fc1 = nn.Linear(hidden_channels, 32)
        self.resource_fc2 = nn.Linear(32, 5)  # Assuming 5 resource types
        
        # Graph-level classification (for overall security posture)
        self.graph_fc1 = nn.Linear(hidden_channels, 32)
        self.graph_fc2 = nn.Linear(32, 4)  # 4 risk levels: low, medium, high, critical
    
    def encode(self, x, edge_index, edge_attr=None, batch=None):
        """
        Encode the graph structure into node embeddings.
        
        Args:
            x: Node features [num_nodes, num_node_features]
            edge_index: Graph connectivity [2, num_edges]
            edge_attr: Edge features [num_edges, num_edge_features]
            batch: Batch vector for multiple graphs [num_nodes]
            
        Returns:
            Node embeddings [num_nodes, hidden_channels]
        """
        # Apply graph convolutional layers
        for i, conv in enumerate(self.conv_layers):
            if self.model_type == "gcn" or self.model_type == "gat":
                x = conv(x, edge_index)
            elif self.model_type == "sage":
                x = conv(x, edge_index)
            
            # Apply non-linearity and dropout (except after last layer)
            if i < self.num_layers - 1:
                x = F.relu(x)
                x = F.dropout(x, p=self.dropout, training=self.training)
        
        return x
    
    def detect_anomalies(self, x):
        """
        Detect anomalies based on node embeddings.
        
        Args:
            x: Node embeddings [num_nodes, hidden_channels]
            
        Returns:
            Anomaly scores [num_nodes, 1]
        """
        x = self.anomaly_fc1(x)
        x = F.relu(x)
        x = F.dropout(x, p=self.dropout, training=self.training)
        x = self.anomaly_fc2(x)
        return torch.sigmoid(x)
    
    def score_risk(self, x):
        """
        Score risk based on node embeddings.
        
        Args:
            x: Node embeddings [num_nodes, hidden_channels]
            
        Returns:
            Risk scores [num_nodes, 1]
        """
        x = self.risk_fc1(x)
        x = F.relu(x)
        x = F.dropout(x, p=self.dropout, training=self.training)
        x = self.risk_fc2(x)
        return torch.sigmoid(x)
    
    def classify_resources(self, x):
        """
        Classify resource types based on node embeddings.
        
        Args:
            x: Node embeddings [num_nodes, hidden_channels]
            
        Returns:
            Resource type logits [num_nodes, num_resource_types]
        """
        x = self.resource_fc1(x)
        x = F.relu(x)
        x = F.dropout(x, p=self.dropout, training=self.training)
        x = self.resource_fc2(x)
        return x
    
    def classify_graph(self, x, batch):
        """
        Classify overall graph security posture.
        
        Args:
            x: Node embeddings [num_nodes, hidden_channels]
            batch: Batch vector for multiple graphs [num_nodes]
            
        Returns:
            Graph classification logits [num_graphs, num_classes]
        """
        # Pool node embeddings to graph embeddings
        x = global_mean_pool(x, batch)
        
        # Apply classification layers
        x = self.graph_fc1(x)
        x = F.relu(x)
        x = F.dropout(x, p=self.dropout, training=self.training)
        x = self.graph_fc2(x)
        return x
    
    def forward(self, x, edge_index, edge_attr=None, batch=None):
        """
        Forward pass through the model.
        
        Args:
            x: Node features [num_nodes, num_node_features]
            edge_index: Graph connectivity [2, num_edges]
            edge_attr: Edge features [num_edges, num_edge_features]
            batch: Batch vector for multiple graphs [num_nodes]
            
        Returns:
            Tuple of (node_embeddings, anomaly_scores, risk_scores, 
                     resource_type_logits, graph_logits)
        """
        # Encode graph
        node_embeddings = self.encode(x, edge_index, edge_attr, batch)
        
        # Generate predictions
        anomaly_scores = self.detect_anomalies(node_embeddings)
        risk_scores = self.score_risk(node_embeddings)
        resource_type_logits = self.classify_resources(node_embeddings)
        
        # Graph-level classification (if batch is provided)
        graph_logits = None
        if batch is not None:
            graph_logits = self.classify_graph(node_embeddings, batch)
        
        return node_embeddings, anomaly_scores, risk_scores, resource_type_logits, graph_logits
