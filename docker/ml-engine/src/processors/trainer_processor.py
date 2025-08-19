"""
Trainer Processor for FlowCraft ML Engine
Handles model training operations
"""

import pandas as pd
import numpy as np
import pickle
import joblib
from typing import Dict, Any, List, Optional, Union
from pathlib import Path
import logging
import asyncio
from datetime import datetime

# ML Libraries
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.svm import SVC, SVR
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error, r2_score, classification_report

# Deep Learning (optional)
try:
    import tensorflow as tf
    from tensorflow import keras
    HAS_TENSORFLOW = True
except ImportError:
    HAS_TENSORFLOW = False
    tf = None

try:
    import torch
    import torch.nn as nn
    HAS_PYTORCH = True
except ImportError:
    HAS_PYTORCH = False
    torch = None

from src.processors.base_processor import BaseProcessor, ProcessorError, ValidationError

logger = logging.getLogger(__name__)

class TrainerProcessor(BaseProcessor):
    """Processor for model training operations"""
    
    def __init__(self):
        super().__init__()
        self.description = "Train machine learning models on datasets"
        self.supported_algorithms = {
            'classification': [
                'random_forest', 'logistic_regression', 'svm', 'decision_tree', 
                'naive_bayes', 'knn', 'neural_network'
            ],
            'regression': [
                'random_forest', 'linear_regression', 'svm', 'decision_tree', 
                'knn', 'neural_network'
            ]
        }
    
    def get_inputs(self) -> List[str]:
        return ["X_train", "y_train", "X_val", "y_val", "training_config"]
    
    def get_outputs(self) -> List[str]:
        return ["trained_model", "training_metrics", "model_metadata", "predictions"]
    
    async def process(self, node_data: Dict[str, Any], context: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Process model training"""
        
        try:
            await self.pre_process(node_data, context)
            
            # Get training data from context
            X_train = self.get_input_data("X_train", node_data, context)
            y_train = self.get_input_data("y_train", node_data, context)
            X_val = self.get_input_data("X_val", node_data, context)
            y_val = self.get_input_data("y_val", node_data, context)
            
            if X_train is None or y_train is None:
                raise ValidationError("Training data (X_train, y_train) is required", self.name, node_data.get('id'))
            
            # Get training configuration
            node_config = node_data.get('data', {})
            training_config = node_config.get('training_config', {})
            
            self.log_progress("Starting model training", 10)
            
            # Determine task type and algorithm
            task_type = training_config.get('task_type', 'auto')
            algorithm = training_config.get('algorithm', 'random_forest')
            
            if task_type == 'auto':
                task_type = self._detect_task_type(y_train)
            
            self.log_progress(f"Training {algorithm} for {task_type}", 20)
            
            # Create and configure the model
            model = await self._create_model(algorithm, task_type, training_config)
            
            self.log_progress("Model created, starting training", 30)
            
            # Train the model
            trained_model, training_history = await self._train_model(
                model, X_train, y_train, X_val, y_val, training_config
            )
            
            self.log_progress("Training completed, evaluating model", 70)
            
            # Evaluate the model
            metrics = await self._evaluate_model(
                trained_model, X_train, y_train, X_val, y_val, task_type
            )
            
            # Generate predictions
            predictions = {}
            if X_val is not None:
                predictions['validation'] = trained_model.predict(X_val)
            
            self.log_progress("Evaluation completed", 85)
            
            # Save model
            model_path = await self._save_model(trained_model, training_config)
            
            # Generate model metadata
            metadata = await self._generate_model_metadata(
                trained_model, algorithm, task_type, training_config, training_history
            )
            
            result = {
                "trained_model": trained_model,
                "model_path": model_path,
                "training_metrics": metrics,
                "model_metadata": metadata,
                "predictions": predictions,
                "training_history": training_history
            }
            
            self.log_progress("Model training completed", 100)
            
            return await self.post_process(result, node_data, context)
            
        except Exception as e:
            logger.error(f"Model training failed: {str(e)}")
            raise ProcessorError(f"Model training failed: {str(e)}", self.name, node_data.get('id'))
    
    def _detect_task_type(self, y_train) -> str:
        """Auto-detect whether it's classification or regression"""
        
        if hasattr(y_train, 'dtype'):
            if y_train.dtype == 'object' or y_train.dtype.name == 'category':
                return 'classification'
            
            unique_values = len(np.unique(y_train))
            total_values = len(y_train)
            
            # If unique values are less than 10% of total, likely classification
            if unique_values <= max(10, total_values * 0.1):
                return 'classification'
            else:
                return 'regression'
        
        return 'classification'  # Default fallback
    
    async def _create_model(self, algorithm: str, task_type: str, config: Dict[str, Any]):
        """Create a model instance based on algorithm and task type"""
        
        hyperparams = config.get('hyperparameters', {})
        random_state = config.get('random_state', 42)
        
        if algorithm == 'random_forest':
            if task_type == 'classification':
                return RandomForestClassifier(
                    n_estimators=hyperparams.get('n_estimators', 100),
                    max_depth=hyperparams.get('max_depth'),
                    min_samples_split=hyperparams.get('min_samples_split', 2),
                    min_samples_leaf=hyperparams.get('min_samples_leaf', 1),
                    random_state=random_state
                )
            else:
                return RandomForestRegressor(
                    n_estimators=hyperparams.get('n_estimators', 100),
                    max_depth=hyperparams.get('max_depth'),
                    min_samples_split=hyperparams.get('min_samples_split', 2),
                    min_samples_leaf=hyperparams.get('min_samples_leaf', 1),
                    random_state=random_state
                )
        
        elif algorithm == 'logistic_regression':
            if task_type != 'classification':
                raise ValidationError("Logistic regression is only for classification tasks", self.name)
            return LogisticRegression(
                C=hyperparams.get('C', 1.0),
                max_iter=hyperparams.get('max_iter', 1000),
                random_state=random_state
            )
        
        elif algorithm == 'linear_regression':
            if task_type != 'regression':
                raise ValidationError("Linear regression is only for regression tasks", self.name)
            return LinearRegression()
        
        elif algorithm == 'svm':
            if task_type == 'classification':
                return SVC(
                    C=hyperparams.get('C', 1.0),
                    kernel=hyperparams.get('kernel', 'rbf'),
                    gamma=hyperparams.get('gamma', 'scale'),
                    random_state=random_state
                )
            else:
                return SVR(
                    C=hyperparams.get('C', 1.0),
                    kernel=hyperparams.get('kernel', 'rbf'),
                    gamma=hyperparams.get('gamma', 'scale')
                )
        
        elif algorithm == 'decision_tree':
            if task_type == 'classification':
                return DecisionTreeClassifier(
                    max_depth=hyperparams.get('max_depth'),
                    min_samples_split=hyperparams.get('min_samples_split', 2),
                    min_samples_leaf=hyperparams.get('min_samples_leaf', 1),
                    random_state=random_state
                )
            else:
                return DecisionTreeRegressor(
                    max_depth=hyperparams.get('max_depth'),
                    min_samples_split=hyperparams.get('min_samples_split', 2),
                    min_samples_leaf=hyperparams.get('min_samples_leaf', 1),
                    random_state=random_state
                )
        
        elif algorithm == 'naive_bayes':
            if task_type != 'classification':
                raise ValidationError("Naive Bayes is only for classification tasks", self.name)
            return GaussianNB()
        
        elif algorithm == 'knn':
            n_neighbors = hyperparams.get('n_neighbors', 5)
            if task_type == 'classification':
                return KNeighborsClassifier(n_neighbors=n_neighbors)
            else:
                return KNeighborsRegressor(n_neighbors=n_neighbors)
        
        elif algorithm == 'neural_network':
            return await self._create_neural_network(task_type, config)
        
        else:
            raise ValidationError(f"Unsupported algorithm: {algorithm}", self.name)
    
    async def _create_neural_network(self, task_type: str, config: Dict[str, Any]):
        """Create a neural network model"""
        
        if not HAS_TENSORFLOW:
            raise ProcessorError("TensorFlow not available for neural network training", self.name)
        
        hyperparams = config.get('hyperparameters', {})
        
        # Basic neural network architecture
        model = keras.Sequential([
            keras.layers.Dense(
                hyperparams.get('hidden_units', 64),
                activation=hyperparams.get('activation', 'relu'),
                input_shape=(hyperparams.get('input_dim'),)  # Will be set during training
            ),
            keras.layers.Dropout(hyperparams.get('dropout', 0.2)),
            keras.layers.Dense(
                hyperparams.get('hidden_units_2', 32),
                activation=hyperparams.get('activation', 'relu')
            ),
        ])
        
        # Output layer
        if task_type == 'classification':
            num_classes = hyperparams.get('num_classes', 2)
            if num_classes == 2:
                model.add(keras.layers.Dense(1, activation='sigmoid'))
                loss = 'binary_crossentropy'
                metrics = ['accuracy']
            else:
                model.add(keras.layers.Dense(num_classes, activation='softmax'))
                loss = 'categorical_crossentropy'
                metrics = ['accuracy']
        else:
            model.add(keras.layers.Dense(1))
            loss = 'mse'
            metrics = ['mae']
        
        # Compile model
        model.compile(
            optimizer=hyperparams.get('optimizer', 'adam'),
            loss=loss,
            metrics=metrics
        )
        
        return model
    
    async def _train_model(self, model, X_train, y_train, X_val, y_val, config: Dict[str, Any]):
        """Train the model"""
        
        training_history = {}
        
        if hasattr(model, 'fit'):
            # Scikit-learn style training
            if X_val is not None and y_val is not None:
                # For some models, we can use validation data during training
                if hasattr(model, 'partial_fit'):
                    # Online learning models
                    model.fit(X_train, y_train)
                else:
                    model.fit(X_train, y_train)
            else:
                model.fit(X_train, y_train)
        
        elif hasattr(model, 'compile'):
            # TensorFlow/Keras style training
            epochs = config.get('hyperparameters', {}).get('epochs', 10)
            batch_size = config.get('hyperparameters', {}).get('batch_size', 32)
            
            # Set input dimension based on training data
            if hasattr(X_train, 'shape') and len(X_train.shape) > 1:
                input_dim = X_train.shape[1]
                model.layers[0].build((None, input_dim))
            
            validation_data = (X_val, y_val) if X_val is not None and y_val is not None else None
            
            history = model.fit(
                X_train, y_train,
                epochs=epochs,
                batch_size=batch_size,
                validation_data=validation_data,
                verbose=0
            )
            
            training_history = history.history
        
        return model, training_history
    
    async def _evaluate_model(self, model, X_train, y_train, X_val, y_val, task_type: str) -> Dict[str, Any]:
        """Evaluate the trained model"""
        
        metrics = {}
        
        try:
            # Training metrics
            y_train_pred = model.predict(X_train)
            
            if task_type == 'classification':
                # Handle probability outputs
                if hasattr(model, 'predict_proba') and len(y_train_pred.shape) > 1:
                    y_train_pred = np.argmax(y_train_pred, axis=1)
                elif len(y_train_pred.shape) > 1 and y_train_pred.shape[1] == 1:
                    y_train_pred = (y_train_pred > 0.5).astype(int).flatten()
                
                metrics['train'] = {
                    'accuracy': accuracy_score(y_train, y_train_pred),
                    'precision': precision_score(y_train, y_train_pred, average='weighted', zero_division=0),
                    'recall': recall_score(y_train, y_train_pred, average='weighted', zero_division=0),
                    'f1_score': f1_score(y_train, y_train_pred, average='weighted', zero_division=0)
                }
            else:
                metrics['train'] = {
                    'mse': mean_squared_error(y_train, y_train_pred),
                    'rmse': np.sqrt(mean_squared_error(y_train, y_train_pred)),
                    'r2_score': r2_score(y_train, y_train_pred)
                }
            
            # Validation metrics
            if X_val is not None and y_val is not None:
                y_val_pred = model.predict(X_val)
                
                if task_type == 'classification':
                    if hasattr(model, 'predict_proba') and len(y_val_pred.shape) > 1:
                        y_val_pred = np.argmax(y_val_pred, axis=1)
                    elif len(y_val_pred.shape) > 1 and y_val_pred.shape[1] == 1:
                        y_val_pred = (y_val_pred > 0.5).astype(int).flatten()
                    
                    metrics['validation'] = {
                        'accuracy': accuracy_score(y_val, y_val_pred),
                        'precision': precision_score(y_val, y_val_pred, average='weighted', zero_division=0),
                        'recall': recall_score(y_val, y_val_pred, average='weighted', zero_division=0),
                        'f1_score': f1_score(y_val, y_val_pred, average='weighted', zero_division=0)
                    }
                else:
                    metrics['validation'] = {
                        'mse': mean_squared_error(y_val, y_val_pred),
                        'rmse': np.sqrt(mean_squared_error(y_val, y_val_pred)),
                        'r2_score': r2_score(y_val, y_val_pred)
                    }
        
        except Exception as e:
            logger.warning(f"Error computing metrics: {str(e)}")
            metrics['error'] = str(e)
        
        return metrics
    
    async def _save_model(self, model, config: Dict[str, Any]) -> Optional[str]:
        """Save the trained model"""
        
        save_model = config.get('save_model', True)
        if not save_model:
            return None
        
        model_dir = Path(config.get('model_output_dir', '/app/models'))
        model_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        model_name = config.get('model_name', f'model_{timestamp}')
        
        try:
            if hasattr(model, 'save'):  # TensorFlow/Keras model
                model_path = model_dir / f"{model_name}.h5"
                model.save(str(model_path))
            else:  # Scikit-learn model
                model_path = model_dir / f"{model_name}.pkl"
                joblib.dump(model, str(model_path))
            
            logger.info(f"Model saved to {model_path}")
            return str(model_path)
            
        except Exception as e:
            logger.warning(f"Failed to save model: {str(e)}")
            return None
    
    async def _generate_model_metadata(self, model, algorithm: str, task_type: str, config: Dict[str, Any], training_history: Dict[str, Any]) -> Dict[str, Any]:
        """Generate metadata about the trained model"""
        
        metadata = {
            "algorithm": algorithm,
            "task_type": task_type,
            "model_type": type(model).__name__,
            "training_config": config,
            "training_timestamp": datetime.utcnow().isoformat(),
        }
        
        # Add hyperparameters
        if hasattr(model, 'get_params'):
            metadata["hyperparameters"] = model.get_params()
        
        # Add training history for deep learning models
        if training_history:
            metadata["training_history"] = training_history
        
        # Add feature importance for tree-based models
        if hasattr(model, 'feature_importances_'):
            metadata["feature_importance"] = model.feature_importances_.tolist()
        
        return metadata
    
    def validate_inputs(self, node_data: Dict[str, Any], context: Dict[str, Any]) -> bool:
        """Validate trainer processor inputs"""
        
        # Check training data
        X_train = self.get_input_data("X_train", node_data, context)
        y_train = self.get_input_data("y_train", node_data, context)
        
        if X_train is None or y_train is None:
            logger.error("Training data (X_train, y_train) is required")
            return False
        
        # Validate training configuration
        training_config = node_data.get('data', {}).get('training_config', {})
        algorithm = training_config.get('algorithm', 'random_forest')
        task_type = training_config.get('task_type', 'auto')
        
        if task_type not in ['auto', 'classification', 'regression']:
            logger.error(f"Invalid task type: {task_type}")
            return False
        
        # Check if algorithm is supported for the task type
        if task_type != 'auto':
            supported_algos = self.supported_algorithms.get(task_type, [])
            if algorithm not in supported_algos:
                logger.error(f"Algorithm {algorithm} not supported for {task_type}")
                return False
        
        return True
