import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch_geometric.loader import DataLoader
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import roc_auc_score, precision_recall_curve, average_precision_score
import time
import json
from datetime import datetime

from backend.models.gnn_model import CloudSecurityGNN
from backend.data.graph_dataset import CloudSecurityDataset, CloudSecurityGraphGenerator

class CloudSecurityTrainer:
    """
    Trainer for cloud security GNN models.
    """
    
    def __init__(self, model, device=None, output_dir='./output'):
        """
        Initialize the trainer.
        
        Args:
            model: GNN model to train
            device: Device to use for training ('cuda' or 'cpu')
            output_dir: Directory to save outputs
        """
        self.model = model
        self.device = device if device is not None else torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.output_dir = output_dir
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        # Move model to device
        self.model = self.model.to(self.device)
        
        # Initialize metrics
        self.train_losses = []
        self.val_losses = []
        self.val_aucs = []
        self.val_aps = []
    
    def train(self, train_loader, val_loader, num_epochs=100, learning_rate=0.001, 
              weight_decay=5e-4, patience=10, task='node_classification'):
        """
        Train the model.
        
        Args:
            train_loader: DataLoader for training data
            val_loader: DataLoader for validation data
            num_epochs: Number of epochs to train
            learning_rate: Learning rate for optimizer
            weight_decay: Weight decay for optimizer
            patience: Patience for early stopping
            task: Training task ('node_classification', 'graph_classification', or 'anomaly_detection')
            
        Returns:
            Best validation AUC
        """
        # Set up optimizer
        optimizer = optim.Adam(self.model.parameters(), lr=learning_rate, weight_decay=weight_decay)
        
        # Set up loss function based on task
        if task == 'node_classification' or task == 'graph_classification':
            criterion = nn.CrossEntropyLoss()
        elif task == 'anomaly_detection':
            criterion = nn.BCELoss()
        else:
            raise ValueError(f"Unknown task: {task}")
        
        # Initialize early stopping
        best_val_auc = 0.0
        best_epoch = 0
        patience_counter = 0
        
        # Training loop
        for epoch in range(num_epochs):
            # Training
            train_loss = self._train_epoch(train_loader, optimizer, criterion, task)
            self.train_losses.append(train_loss)
            
            # Validation
            val_loss, val_auc, val_ap = self._validate(val_loader, criterion, task)
            self.val_losses.append(val_loss)
            self.val_aucs.append(val_auc)
            self.val_aps.append(val_ap)
            
            # Print progress
            print(f'Epoch: {epoch+1:03d}, Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}, Val AUC: {val_auc:.4f}, Val AP: {val_ap:.4f}')
            
            # Check for improvement
            if val_auc > best_val_auc:
                best_val_auc = val_auc
                best_epoch = epoch
                patience_counter = 0
                
                # Save best model
                self.save_model(os.path.join(self.output_dir, 'best_model.pt'))
            else:
                patience_counter += 1
                if patience_counter >= patience:
                    print(f'Early stopping at epoch {epoch+1}')
                    break
        
        # Print best results
        print(f'Best validation AUC: {best_val_auc:.4f} at epoch {best_epoch+1}')
        
        # Plot training curves
        self._plot_training_curves()
        
        return best_val_auc
    
    def _train_epoch(self, train_loader, optimizer, criterion, task):
        """
        Train for one epoch.
        
        Args:
            train_loader: DataLoader for training data
            optimizer: Optimizer
            criterion: Loss function
            task: Training task
            
        Returns:
            Average training loss
        """
        self.model.train()
        total_loss = 0
        
        for data in train_loader:
            # Move data to device
            data = data.to(self.device)
            
            # Zero gradients
            optimizer.zero_grad()
            
            # Forward pass
            node_embeddings, anomaly_scores, risk_scores, resource_type_logits, graph_logits = self.model(
                data.x, data.edge_index, data.edge_attr, data.batch)
            
            # Compute loss based on task
            if task == 'node_classification':
                loss = criterion(resource_type_logits, data.node_y)
            elif task == 'graph_classification':
                loss = criterion(graph_logits, data.y)
            elif task == 'anomaly_detection':
                loss = criterion(anomaly_scores.view(-1), data.node_y.float())
            
            # Backward pass and optimize
            loss.backward()
            optimizer.step()
            
            # Accumulate loss
            total_loss += loss.item() * data.num_graphs
        
        # Compute average loss
        avg_loss = total_loss / len(train_loader.dataset)
        
        return avg_loss
    
    def _validate(self, val_loader, criterion, task):
        """
        Validate the model.
        
        Args:
            val_loader: DataLoader for validation data
            criterion: Loss function
            task: Training task
            
        Returns:
            Tuple of (average validation loss, AUC, average precision)
        """
        self.model.eval()
        total_loss = 0
        all_preds = []
        all_labels = []
        
        with torch.no_grad():
            for data in val_loader:
                # Move data to device
                data = data.to(self.device)
                
                # Forward pass
                node_embeddings, anomaly_scores, risk_scores, resource_type_logits, graph_logits = self.model(
                    data.x, data.edge_index, data.edge_attr, data.batch)
                
                # Compute loss and predictions based on task
                if task == 'node_classification':
                    loss = criterion(resource_type_logits, data.node_y)
                    preds = torch.softmax(resource_type_logits, dim=1).cpu().numpy()
                    labels = data.node_y.cpu().numpy()
                elif task == 'graph_classification':
                    loss = criterion(graph_logits, data.y)
                    preds = torch.softmax(graph_logits, dim=1).cpu().numpy()
                    labels = data.y.cpu().numpy()
                elif task == 'anomaly_detection':
                    loss = criterion(anomaly_scores.view(-1), data.node_y.float())
                    preds = anomaly_scores.view(-1).cpu().numpy()
                    labels = data.node_y.cpu().numpy()
                
                # Accumulate loss and predictions
                total_loss += loss.item() * data.num_graphs
                all_preds.extend(preds)
                all_labels.extend(labels)
        
        # Compute average loss
        avg_loss = total_loss / len(val_loader.dataset)
        
        # Compute metrics
        if task == 'node_classification' or task == 'graph_classification':
            # For multi-class classification, compute AUC for each class
            all_preds = np.array(all_preds)
            all_labels = np.array(all_labels)
            
            # One-hot encode labels
            num_classes = all_preds.shape[1]
            labels_one_hot = np.zeros((len(all_labels), num_classes))
            for i, label in enumerate(all_labels):
                labels_one_hot[i, label] = 1
            
            # Compute AUC and AP for each class
            aucs = []
            aps = []
            for i in range(num_classes):
                if np.sum(labels_one_hot[:, i]) > 0:  # Only compute if class exists in labels
                    aucs.append(roc_auc_score(labels_one_hot[:, i], all_preds[:, i]))
                    aps.append(average_precision_score(labels_one_hot[:, i], all_preds[:, i]))
            
            # Compute macro-average
            auc = np.mean(aucs) if aucs else 0.0
            ap = np.mean(aps) if aps else 0.0
        else:
            # For binary classification (anomaly detection)
            all_preds = np.array(all_preds)
            all_labels = np.array(all_labels)
            
            # Compute AUC and AP
            auc = roc_auc_score(all_labels, all_preds) if np.sum(all_labels) > 0 else 0.0
            ap = average_precision_score(all_labels, all_preds) if np.sum(all_labels) > 0 else 0.0
        
        return avg_loss, auc, ap
    
    def _plot_training_curves(self):
        """
        Plot training curves.
        """
        # Create figure
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
        
        # Plot loss curves
        ax1.plot(self.train_losses, label='Train Loss')
        ax1.plot(self.val_losses, label='Validation Loss')
        ax1.set_xlabel('Epoch')
        ax1.set_ylabel('Loss')
        ax1.set_title('Training and Validation Loss')
        ax1.legend()
        
        # Plot AUC and AP curves
        ax2.plot(self.val_aucs, label='Validation AUC')
        ax2.plot(self.val_aps, label='Validation AP')
        ax2.set_xlabel('Epoch')
        ax2.set_ylabel('Score')
        ax2.set_title('Validation Metrics')
        ax2.legend()
        
        # Save figure
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, 'training_curves.png'))
        plt.close()
    
    def save_model(self, path):
        """
        Save the model.
        
        Args:
            path: Path to save the model
        """
        torch.save(self.model.state_dict(), path)
        print(f'Model saved to {path}')
    
    def load_model(self, path):
        """
        Load the model.
        
        Args:
            path: Path to load the model from
        """
        self.model.load_state_dict(torch.load(path, map_location=self.device))
        self.model = self.model.to(self.device)
        print(f'Model loaded from {path}')
    
    def evaluate(self, test_loader, task='node_classification'):
        """
        Evaluate the model on test data.
        
        Args:
            test_loader: DataLoader for test data
            task: Evaluation task
            
        Returns:
            Dictionary of evaluation metrics
        """
        self.model.eval()
        all_preds = []
        all_labels = []
        
        with torch.no_grad():
            for data in test_loader:
                # Move data to device
                data = data.to(self.device)
                
                # Forward pass
                node_embeddings, anomaly_scores, risk_scores, resource_type_logits, graph_logits = self.model(
                    data.x, data.edge_index, data.edge_attr, data.batch)
                
                # Get predictions based on task
                if task == 'node_classification':
                    preds = torch.softmax(resource_type_logits, dim=1).cpu().numpy()
                    labels = data.node_y.cpu().numpy()
                elif task == 'graph_classification':
                    preds = torch.softmax(graph_logits, dim=1).cpu().numpy()
                    labels = data.y.cpu().numpy()
                elif task == 'anomaly_detection':
                    preds = anomaly_scores.view(-1).cpu().numpy()
                    labels = data.node_y.cpu().numpy()
                
                # Accumulate predictions
                all_preds.extend(preds)
                all_labels.extend(labels)
        
        # Convert to numpy arrays
        all_preds = np.array(all_preds)
        all_labels = np.array(all_labels)
        
        # Compute metrics
        metrics = {}
        
        if task == 'node_classification' or task == 'graph_classification':
            # For multi-class classification
            num_classes = all_preds.shape[1]
            
            # One-hot encode labels
            labels_one_hot = np.zeros((len(all_labels), num_classes))
            for i, label in enumerate(all_labels):
                labels_one_hot[i, label] = 1
            
            # Compute metrics for each class
            class_metrics = []
            for i in range(num_classes):
                if np.sum(labels_one_hot[:, i]) > 0:  # Only compute if class exists in labels
                    class_auc = roc_auc_score(labels_one_hot[:, i], all_preds[:, i])
                    class_ap = average_precision_score(labels_one_hot[:, i], all_preds[:, i])
                    
                    # Compute precision-recall curve
                    precision, recall, thresholds = precision_recall_curve(labels_one_hot[:, i], all_preds[:, i])
                    
                    class_metrics.append({
                        'class': i,
                        'auc': float(class_auc),
                        'ap': float(class_ap),
                        'precision': precision.tolist(),
                        'recall': recall.tolist(),
                        'thresholds': thresholds.tolist() if len(thresholds) > 0 else []
                    })
            
            # Compute macro-average
            metrics['class_metrics'] = class_metrics
            metrics['macro_auc'] = float(np.mean([m['auc'] for m in class_metrics]))
            metrics['macro_ap'] = float(np.mean([m['ap'] for m in class_metrics]))
            
            # Compute accuracy
            pred_labels = np.argmax(all_preds, axis=1)
            metrics['accuracy'] = float(np.mean(pred_labels == all_labels))
        else:
            # For binary classification (anomaly detection)
            if np.sum(all_labels) > 0:  # Only compute if positive labels exist
                metrics['auc'] = float(roc_auc_score(all_labels, all_preds))
                metrics['ap'] = float(average_precision_score(all_labels, all_preds))
                
                # Compute precision-recall curve
                precision, recall, thresholds = precision_recall_curve(all_labels, all_preds)
                
                metrics['precision'] = precision.tolist()
                metrics['recall'] = recall.tolist()
                metrics['thresholds'] = thresholds.tolist() if len(thresholds) > 0 else []
                
                # Compute F1 score at different thresholds
                f1_scores = []
                for i in range(len(precision)):
                    if precision[i] + recall[i] > 0:
                        f1 = 2 * precision[i] * recall[i] / (precision[i] + recall[i])
                        f1_scores.append(f1)
                    else:
                        f1_scores.append(0)
                
                # Find threshold with best F1 score
                best_idx = np.argmax(f1_scores)
                metrics['best_threshold'] = float(thresholds[best_idx]) if best_idx < len(thresholds) else 0.5
                metrics['best_f1'] = float(f1_scores[best_idx])
                metrics['best_precision'] = float(precision[best_idx])
                metrics['best_recall'] = float(recall[best_idx])
            else:
                metrics['auc'] = 0.0
                metrics['ap'] = 0.0
        
        # Save metrics
        with open(os.path.join(self.output_dir, 'evaluation_metrics.json'), 'w') as f:
            json.dump(metrics, f, indent=2)
        
        return metrics
    
    def predict(self, data):
        """
        Make predictions on new data.
        
        Args:
            data: PyTorch Geometric Data object
            
        Returns:
            Dictionary of predictions
        """
        self.model.eval()
        
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
            'anomaly_scores': anomaly_scores.tolist(),
            'risk_scores': risk_scores.tolist(),
            'resource_type_probs': resource_type_logits.tolist(),
        }
        
        if graph_logits is not None:
            predictions['graph_probs'] = graph_logits.tolist()
        
        return predictions
