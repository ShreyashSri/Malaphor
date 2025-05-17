#!/usr/bin/env python
"""
Script to run the GNN training pipeline for Malaphor.
"""

import os
import argparse
import torch
import json
import numpy as np
from datetime import datetime

from backend.models.gnn_model import CloudSecurityGNN
from backend.data.graph_dataset import CloudSecurityDataset, CloudSecurityGraphGenerator
from backend.training.train import CloudSecurityTrainer

def main():
    parser = argparse.ArgumentParser(description='Train GNN for cloud security anomaly detection')
    
    # Data generation arguments
    parser.add_argument('--generate-data', action='store_true', help='Generate synthetic dataset')
    parser.add_argument('--num-graphs', type=int, default=1000, help='Number of graphs to generate')
    parser.add_argument('--min-nodes', type=int, default=20, help='Minimum number of nodes per graph')
    parser.add_argument('--max-nodes', type=int, default=100, help='Maximum number of nodes per graph')
    parser.add_argument('--anomaly-probability', type=float, default=0.3, help='Probability of introducing an anomaly')
    
    # Model arguments
    parser.add_argument('--hidden-channels', type=int, default=64, help='Number of hidden channels')
    parser.add_argument('--num-layers', type=int, default=3, help='Number of GNN layers')
    parser.add_argument('--model-type', type=str, default='gat', choices=['gcn', 'gat', 'sage'], help='Type of GNN layer')
    
    # Training arguments
    parser.add_argument('--batch-size', type=int, default=32, help='Batch size')
    parser.add_argument('--num-epochs', type=int, default=100, help='Number of epochs')
    parser.add_argument('--learning-rate', type=float, default=0.001, help='Learning rate')
    
    # Output arguments
    parser.add_argument('--output-dir', type=str, default='./output', help='Output directory')
    
    args = parser.parse_args()
    
    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Set device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f'Using device: {device}')
    
    # Generate synthetic dataset
    if args.generate_data:
        print('Generating synthetic dataset...')
        generator = CloudSecurityGraphGenerator()
        
        # Generate graphs
        graphs = generator.generate_dataset(
            num_graphs=args.num_graphs,
            min_nodes=args.min_nodes,
            max_nodes=args.max_nodes,
            anomaly_probability=args.anomaly_probability
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
        
        print(f'Created datasets with {len(train_dataset)} training, {len(val_dataset)} validation, and {len(test_dataset)} test graphs')
    else:
        print('Using existing datasets')
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
    
    # Create data loaders
    train_loader = torch.utils.data.DataLoader(
        train_dataset,
        batch_size=args.batch_size,
        shuffle=True
    )
    
    val_loader = torch.utils.data.DataLoader(
        val_dataset,
        batch_size=args.batch_size,
        shuffle=False
    )
    
    test_loader = torch.utils.data.DataLoader(
        test_dataset,
        batch_size=args.batch_size,
        shuffle=False
    )
    
    # Create model
    num_node_features = train_dataset.num_node_features
    model = CloudSecurityGNN(
        num_node_features=num_node_features,
        hidden_channels=args.hidden_channels,
        num_layers=args.num_layers,
        model_type=args.model_type
    )
    
    # Save model configuration
    model_config = {
        'num_node_features': num_node_features,
        'hidden_channels': args.hidden_channels,
        'num_layers': args.num_layers,
        'model_type': args.model_type
    }
    
    with open(os.path.join(args.output_dir, 'model_config.json'), 'w') as f:
        json.dump(model_config, f)
    
    # Create trainer
    trainer = CloudSecurityTrainer(
        model=model,
        device=device,
        output_dir=args.output_dir
    )
    
    # Train model
    print('Training model...')
    trainer.train(
        train_loader=train_loader,
        val_loader=val_loader,
        num_epochs=args.num_epochs,
        learning_rate=args.learning_rate,
        task='anomaly_detection'
    )
    
    # Evaluate on test set
    print('Evaluating on test set...')
    metrics = trainer.evaluate(test_loader, task='anomaly_detection')
    
    # Print metrics
    print(f'Test AUC: {metrics["auc"]:.4f}')
    print(f'Test AP: {metrics["ap"]:.4f}')
    print(f'Test best F1: {metrics["best_f1"]:.4f} (threshold: {metrics["best_threshold"]:.4f})')
    
    print(f'Model saved to {os.path.join(args.output_dir, "best_model.pt")}')

if __name__ == '__main__':
    main()
