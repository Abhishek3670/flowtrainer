"""
Split Processor for FlowCraft ML Engine
Handles train/test/validation split operations
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Tuple, Union
from sklearn.model_selection import train_test_split, StratifiedShuffleSplit, TimeSeriesSplit
import logging

from src.processors.base_processor import BaseProcessor, ProcessorError, ValidationError

logger = logging.getLogger(__name__)

class SplitProcessor(BaseProcessor):
    """Processor for data splitting operations"""
    
    def __init__(self):
        super().__init__()
        self.description = "Split datasets into training, validation, and test sets"
        self.supported_strategies = ['random', 'stratified', 'time_series', 'custom']
    
    def get_inputs(self) -> List[str]:
        return ["dataset", "features", "target", "split_config"]
    
    def get_outputs(self) -> List[str]:
        return [
            "X_train", "X_val", "X_test",
            "y_train", "y_val", "y_test", 
            "split_metadata"
        ]
    
    async def process(self, node_data: Dict[str, Any], context: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Process data splitting"""
        
        try:
            await self.pre_process(node_data, context)
            
            # Get inputs from context
            features = self.get_input_data("features", node_data, context)
            target = self.get_input_data("target", node_data, context)
            dataset = self.get_input_data("dataset", node_data, context)
            
            if features is None:
                raise ValidationError("Features data is required", self.name, node_data.get('id'))
            
            # Get split configuration
            node_config = node_data.get('data', {})
            split_config = node_config.get('split_config', {})
            
            self.log_progress("Starting data split", 10)
            
            # Perform the split
            split_result = await self._perform_split(features, target, split_config)
            
            self.log_progress("Data split completed", 80)
            
            # Generate split metadata
            metadata = await self._generate_split_metadata(split_result, split_config)
            
            result = {
                **split_result,
                "split_metadata": metadata
            }
            
            self.log_progress("Split processing completed", 100)
            
            return await self.post_process(result, node_data, context)
            
        except Exception as e:
            logger.error(f"Data split processing failed: {str(e)}")
            raise ProcessorError(f"Data split processing failed: {str(e)}", self.name, node_data.get('id'))
    
    async def _perform_split(self, features: pd.DataFrame, target: Optional[pd.Series], config: Dict[str, Any]) -> Dict[str, Any]:
        """Perform the actual data splitting"""
        
        # Get split parameters
        strategy = config.get('strategy', 'random')
        train_size = config.get('train_size', 0.7)
        val_size = config.get('val_size', 0.15)
        test_size = config.get('test_size', 0.15)
        random_state = config.get('random_state', 42)
        shuffle = config.get('shuffle', True)
        
        # Validate split sizes
        if abs(train_size + val_size + test_size - 1.0) > 1e-6:
            raise ValidationError(f"Split sizes must sum to 1.0, got {train_size + val_size + test_size}", self.name)
        
        if strategy not in self.supported_strategies:
            raise ValidationError(f"Unsupported split strategy: {strategy}", self.name)
        
        # Convert to numpy if pandas
        X = features.values if isinstance(features, pd.DataFrame) else features
        y = target.values if isinstance(target, pd.Series) else target
        
        if strategy == 'random':
            return await self._random_split(X, y, train_size, val_size, test_size, random_state, shuffle)
        elif strategy == 'stratified':
            return await self._stratified_split(X, y, train_size, val_size, test_size, random_state)
        elif strategy == 'time_series':
            return await self._time_series_split(X, y, train_size, val_size, test_size)
        elif strategy == 'custom':
            return await self._custom_split(X, y, config)
        else:
            raise ValidationError(f"Strategy {strategy} not implemented", self.name)
    
    async def _random_split(self, X, y, train_size, val_size, test_size, random_state, shuffle) -> Dict[str, Any]:
        """Random splitting strategy"""
        
        if y is not None:
            # First split: separate test set
            X_temp, X_test, y_temp, y_test = train_test_split(
                X, y, test_size=test_size, random_state=random_state, shuffle=shuffle
            )
            
            # Second split: separate train and validation
            val_size_adjusted = val_size / (train_size + val_size)
            X_train, X_val, y_train, y_val = train_test_split(
                X_temp, y_temp, test_size=val_size_adjusted, random_state=random_state, shuffle=shuffle
            )
        else:
            # No target variable - split features only
            X_temp, X_test = train_test_split(
                X, test_size=test_size, random_state=random_state, shuffle=shuffle
            )
            
            val_size_adjusted = val_size / (train_size + val_size)
            X_train, X_val = train_test_split(
                X_temp, test_size=val_size_adjusted, random_state=random_state, shuffle=shuffle
            )
            
            y_train = y_val = y_test = None
        
        return {
            "X_train": X_train,
            "X_val": X_val,
            "X_test": X_test,
            "y_train": y_train,
            "y_val": y_val,
            "y_test": y_test
        }
    
    async def _stratified_split(self, X, y, train_size, val_size, test_size, random_state) -> Dict[str, Any]:
        """Stratified splitting strategy"""
        
        if y is None:
            raise ValidationError("Stratified split requires target variable", self.name)
        
        # First split: separate test set
        sss_test = StratifiedShuffleSplit(n_splits=1, test_size=test_size, random_state=random_state)
        temp_idx, test_idx = next(sss_test.split(X, y))
        
        X_temp, X_test = X[temp_idx], X[test_idx]
        y_temp, y_test = y[temp_idx], y[test_idx]
        
        # Second split: separate train and validation
        val_size_adjusted = val_size / (train_size + val_size)
        sss_val = StratifiedShuffleSplit(n_splits=1, test_size=val_size_adjusted, random_state=random_state)
        train_idx, val_idx = next(sss_val.split(X_temp, y_temp))
        
        X_train, X_val = X_temp[train_idx], X_temp[val_idx]
        y_train, y_val = y_temp[train_idx], y_temp[val_idx]
        
        return {
            "X_train": X_train,
            "X_val": X_val,
            "X_test": X_test,
            "y_train": y_train,
            "y_val": y_val,
            "y_test": y_test
        }
    
    async def _time_series_split(self, X, y, train_size, val_size, test_size) -> Dict[str, Any]:
        """Time series splitting strategy"""
        
        n_samples = X.shape[0]
        
        # Calculate split indices
        train_end = int(n_samples * train_size)
        val_end = int(n_samples * (train_size + val_size))
        
        # Split the data
        X_train = X[:train_end]
        X_val = X[train_end:val_end] if val_size > 0 else None
        X_test = X[val_end:] if test_size > 0 else None
        
        if y is not None:
            y_train = y[:train_end]
            y_val = y[train_end:val_end] if val_size > 0 else None
            y_test = y[val_end:] if test_size > 0 else None
        else:
            y_train = y_val = y_test = None
        
        return {
            "X_train": X_train,
            "X_val": X_val,
            "X_test": X_test,
            "y_train": y_train,
            "y_val": y_val,
            "y_test": y_test
        }
    
    async def _custom_split(self, X, y, config: Dict[str, Any]) -> Dict[str, Any]:
        """Custom splitting strategy based on indices or conditions"""
        
        custom_config = config.get('custom_config', {})
        
        if 'indices' in custom_config:
            # Split based on provided indices
            indices = custom_config['indices']
            train_indices = indices.get('train', [])
            val_indices = indices.get('val', [])
            test_indices = indices.get('test', [])
            
            X_train = X[train_indices] if train_indices else None
            X_val = X[val_indices] if val_indices else None
            X_test = X[test_indices] if test_indices else None
            
            if y is not None:
                y_train = y[train_indices] if train_indices else None
                y_val = y[val_indices] if val_indices else None
                y_test = y[test_indices] if test_indices else None
            else:
                y_train = y_val = y_test = None
        
        elif 'column_condition' in custom_config:
            # Split based on column conditions (requires original dataset)
            raise ValidationError("Column condition splitting not yet implemented", self.name)
        
        else:
            raise ValidationError("Custom split requires 'indices' or 'column_condition' configuration", self.name)
        
        return {
            "X_train": X_train,
            "X_val": X_val,
            "X_test": X_test,
            "y_train": y_train,
            "y_val": y_val,
            "y_test": y_test
        }
    
    async def _generate_split_metadata(self, split_result: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Generate metadata about the split"""
        
        metadata = {
            "strategy": config.get('strategy', 'random'),
            "train_size": config.get('train_size', 0.7),
            "val_size": config.get('val_size', 0.15),
            "test_size": config.get('test_size', 0.15),
            "random_state": config.get('random_state', 42),
            "shuffle": config.get('shuffle', True)
        }
        
        # Add actual split sizes
        X_train = split_result.get("X_train")
        X_val = split_result.get("X_val")
        X_test = split_result.get("X_test")
        
        total_samples = 0
        if X_train is not None:
            total_samples += len(X_train)
        if X_val is not None:
            total_samples += len(X_val)
        if X_test is not None:
            total_samples += len(X_test)
        
        if total_samples > 0:
            metadata["actual_sizes"] = {
                "train": len(X_train) / total_samples if X_train is not None else 0,
                "val": len(X_val) / total_samples if X_val is not None else 0,
                "test": len(X_test) / total_samples if X_test is not None else 0
            }
            
            metadata["sample_counts"] = {
                "train": len(X_train) if X_train is not None else 0,
                "val": len(X_val) if X_val is not None else 0,
                "test": len(X_test) if X_test is not None else 0,
                "total": total_samples
            }
        
        # Add target distribution info if available
        y_train = split_result.get("y_train")
        y_val = split_result.get("y_val")
        y_test = split_result.get("y_test")
        
        if y_train is not None:
            from collections import Counter
            metadata["target_distribution"] = {
                "train": dict(Counter(y_train)),
                "val": dict(Counter(y_val)) if y_val is not None else {},
                "test": dict(Counter(y_test)) if y_test is not None else {}
            }
        
        return metadata
    
    def validate_inputs(self, node_data: Dict[str, Any], context: Dict[str, Any]) -> bool:
        """Validate split processor inputs"""
        
        # Check if features data is available
        features = self.get_input_data("features", node_data, context)
        if features is None:
            logger.error("Features data is required for splitting")
            return False
        
        # Validate split configuration
        split_config = node_data.get('data', {}).get('split_config', {})
        train_size = split_config.get('train_size', 0.7)
        val_size = split_config.get('val_size', 0.15)
        test_size = split_config.get('test_size', 0.15)
        
        if abs(train_size + val_size + test_size - 1.0) > 1e-6:
            logger.error(f"Split sizes must sum to 1.0, got {train_size + val_size + test_size}")
            return False
        
        return True
