import os
import argparse
import torch
import json
import numpy as np
from torch_geometric.loader import DataLoader

from backend.models.gnn_model import CloudSecurityGNN
from backend.data.graph_dataset import CloudSecurityDataset, CloudSecurityGraphGenerator
from backend.training.train import CloudSecurityTrainer

def main(args):
    # Set random seed for reproducibility
    torch.manual_seed(args.seed)
    np.random.seed(args.seed)
    
    # Set device
    device = torch.device('cuda' if torch.cuda.is_available() and not args.no_cuda else 'cpu')
    print(f'Using device: {device}')
    
    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Generate synthetic dataset if needed
    if args.generate_data:
        print('Generating synthetic dataset...')
        generator = CloudSecurityGraphGenerator(
            num_resource_types=args.num_resource_types,
            num_relationship_types=args.num_relationship_types
        )
        
        # Generate graphs
        graphs = generator.generate_dataset(
            num_graphs=args.num_graphs,
            min_nodes=args.min_nodes,
            max_nodes=args.max_nodes,
            edge_probability=args.edge_probability,
            anomaly_probability=args.anomaly_probability,
            seed=args.seed
        )
        
        # Save graphs
        os.makedirs(os.path.join(args.output_dir, 'data'), exist_ok=True)
        with open(os.path.join(args.output_dir, 'data', 'synthetic_graphs.json'), 'w') as f:
            json.dump(graphs, f)
        
        # Split into train, validation, and test sets
        num_train = int(args.num_graphs * 0.7)
        num_val = int(args.num_graphs * 0.15)
        
        train_graphs = graphs[:num_train]
        val_graphs = graphs[num_train:num_train+num_val]
        test_graphs = graphs[num_train+num_val:]
        
        # Create datasets
        train_dataset = CloudSecurityDataset(
            root=os.path.join(args.output_dir, 'data', 'train'),
            graphs=train_graphs
        )
        
        val_dataset = CloudSecurityDataset(
            root=os.path.join(args.output_dir, 'data', 'val'),
            graphs=val_graphs
        )
        
        test_dataset = CloudSecurityDataset(
            root=os.path.join(args.output_dir, 'data', 'test'),
            graphs=test_graphs
        )
    else:
        # Load existing datasets
        train_dataset = CloudSecurityDataset(
            root=os.path.join(args.output_dir, 'data', 'train')
        )
        
        val_dataset = CloudSecurityDataset(
            root=os.path.join(args.output_dir, 'data', 'val')
        )
        
        test_dataset = CloudSecurityDataset(
            root=os.path.join(args.output_dir, 'data', 'test')
        )
    
    print(f'Train dataset: {len(train_dataset)} graphs')
    print(f'Validation dataset: {len(val_dataset)} graphs')
    print(f'Test dataset: {len(test_dataset)} graphs')
    
    # Create data loaders
    train_loader = DataLoader(
        train_dataset,
        batch_size=args.batch_size,
        shuffle=True
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=args.batch_size,
        shuffle=False
    )
    
    test_loader = DataLoader(
        test_dataset,
        batch_size=args.batch_size,
        shuffle=False
    )
    
    # Get number of features
    num_node_features = train_dataset.num_node_features
    num_edge_features = train_dataset.num_edge_features if hasattr(train_dataset, 'num_edge_features') else 0
    
    print(f'Number of node features: {num_node_features}')
    print(f'Number of edge features: {num_edge_features}')
    
    # Create model
    model = CloudSecurityGNN(
        num_node_features=num_node_features,
        num_edge_features=num_edge_features,
        hidden_channels=args.hidden_channels,
        num_layers=args.num_layers,
        dropout=args.dropout,
        model_type=args.model_type
    )
    
    # Create trainer
    trainer = CloudSecurityTrainer(
        model=model,
        device=device,
        output_dir=args.output_dir
    )
    
    # Train model
    if not args.skip_training:
        print('Training model...')
        trainer.train(
            train_loader=train_loader,
            val_loader=val_loader,
            num_epochs=args.num_epochs,
            learning_rate=args.learning_rate,
            weight_decay=args.weight_decay,
            patience=args.patience,
            task=args.task
        )
    
    # Load best model
    best_model_path = os.path.join(args.output_dir, 'best_model.pt')
    if os.path.exists(best_model_path):
        trainer.load_model(best_model_path)
    
    # Evaluate on test set
    print('Evaluating on test set...')
    metrics = trainer.evaluate(test_loader, task=args.task)
    
    # Print metrics
    if args.task == 'node_classification' or args.task == 'graph_classification':
        print(f'Test accuracy: {metrics["accuracy"]:.4f}')
        print(f'Test macro AUC: {metrics["macro_auc"]:.4f}')
        print(f'Test macro AP: {metrics["macro_ap"]:.4f}')
    else:
        print(f'Test AUC: {metrics["auc"]:.4f}')
        print(f'Test AP: {metrics["ap"]:.4f}')
        print(f'Test best F1: {metrics["best_f1"]:.4f} (threshold: {metrics["best_threshold"]:.4f})')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Train GNN for cloud security')
    
    # Data generation arguments
    parser.add_argument('--generate-data', action='store_true', help='Generate synthetic dataset')
    parser.add_argument('--num-graphs', type=int, default=1000, help='Number of graphs to generate')
    parser.add_argument('--min-nodes', type=int, default=20, help='Minimum number of nodes per graph')
    parser.add_argument('--max-nodes', type=int, default=100, help='Maximum number of nodes per graph')
    parser.add_argument('--edge-probability', type=float, default=0.05, help='Probability of an edge between any two nodes')
    parser.add_argument('--anomaly-probability', type=float, default=0.2, help='Probability of introducing an anomaly')
    parser.add_argument('--num-resource-types', type=int, default=5, help='Number of resource types')
    parser.add_argument('--num-relationship-types', type=int, default=10, help='Number of relationship types')
    
    # Model arguments
    parser.add_argument('--hidden-channels', type=int, default=64, help='Number of hidden channels')
    parser.add_argument('--num-layers', type=int, default=3, help='Number of GNN layers')
    parser.add_argument('--dropout', type=float, default=0.2, help='Dropout probability')
    parser.add_argument('--model-type', type=str, default='gat', choices=['gcn', 'gat', 'sage'], help='Type of GNN layer')
    
    # Training arguments
    parser.add_argument('--skip-training', action='store_true', help='Skip training and only evaluate')
    parser.add_argument('--batch-size', type=int, default=32, help='Batch size')
    parser.add_argument('--num-epochs', type=int, default=100, help='Number of epochs')
    parser.add_argument('--learning-rate', type=float, default=0.001, help='Learning rate')
    parser.add_argument('--weight-decay', type=float, default=5e-4, help='Weight decay')
    parser.add_argument('--patience', type=int, default=10, help='Patience for early stopping')
    parser.add_argument('--task', type=str, default='anomaly_detection', 
                        choices=['node_classification', 'graph_classification', 'anomaly_detection'], 
                        help='Training task')
    
    # Other arguments
    parser.add_argument('--seed', type=int, default=42, help='Random seed')
    parser.add_argument('--no-cuda', action='store_true', help='Disable CUDA')
    parser.add_argument('--output-dir', type=str, default='./output', help='Output directory')
    
    args = parser.parse_args()
    
    main(args)
