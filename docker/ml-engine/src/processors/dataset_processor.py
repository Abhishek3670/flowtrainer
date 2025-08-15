"""
Dataset Processor for FlowCraft ML Engine
Handles dataset loading and preprocessing operations
"""

import os
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Union
import asyncio
from pathlib import Path
import logging

from src.processors.base_processor import BaseProcessor, ProcessorError, ValidationError

logger = logging.getLogger(__name__)

class DatasetProcessor(BaseProcessor):
    """Processor for dataset operations"""
    
    def __init__(self):
        super().__init__()
        self.description = "Load and preprocess datasets for ML workflows"
        self.supported_formats = ['.csv', '.json', '.parquet', '.xlsx']
    
    def get_inputs(self) -> List[str]:
        return ["dataset_path", "format", "preprocessing_config"]
    
    def get_outputs(self) -> List[str]:
        return ["dataset", "features", "target", "metadata"]
    
    async def process(self, node_data: Dict[str, Any], context: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
        """Process dataset loading and preprocessing"""
        
        try:
            await self.pre_process(node_data, context)
            
            # Get node configuration
            node_config = node_data.get('data', {})
            dataset_path = node_config.get('dataset_path') or node_config.get('selectedFile', {}).get('path')
            format_type = node_config.get('format', 'auto')
            preprocessing_config = node_config.get('preprocessing_config', {})
            
            if not dataset_path:
                raise ValidationError("Dataset path is required", self.name, node_data.get('id'))
            
            self.log_progress("Loading dataset", 10)
            
            # Load dataset based on format
            dataset = await self._load_dataset(dataset_path, format_type)
            
            self.log_progress("Dataset loaded successfully", 30)
            
            # Apply preprocessing
            processed_dataset = await self._preprocess_dataset(dataset, preprocessing_config)
            
            self.log_progress("Preprocessing completed", 60)
            
            # Extract features and target
            features, target = await self._extract_features_target(processed_dataset, preprocessing_config)
            
            self.log_progress("Feature extraction completed", 80)
            
            # Generate metadata
            metadata = await self._generate_metadata(processed_dataset, features, target)
            
            result = {
                "dataset": processed_dataset,
                "features": features,
                "target": target,
                "metadata": metadata,
                "shape": processed_dataset.shape,
                "columns": list(processed_dataset.columns) if hasattr(processed_dataset, 'columns') else None
            }
            
            self.log_progress("Dataset processing completed", 100)
            
            return await self.post_process(result, node_data, context)
            
        except Exception as e:
            logger.error(f"Dataset processing failed: {str(e)}")
            raise ProcessorError(f"Dataset processing failed: {str(e)}", self.name, node_data.get('id'))
    
    async def _load_dataset(self, dataset_path: str, format_type: str) -> Union[pd.DataFrame, np.ndarray]:
        """Load dataset from file"""
        
        path = Path(dataset_path)
        if not path.exists():
            raise ValidationError(f"Dataset file not found: {dataset_path}", self.name)
        
        # Auto-detect format if not specified
        if format_type == 'auto':
            format_type = path.suffix.lower()
        
        if format_type not in self.supported_formats:
            raise ValidationError(f"Unsupported format: {format_type}", self.name)
        
        try:
            if format_type == '.csv':
                return pd.read_csv(dataset_path)
            elif format_type == '.json':
                return pd.read_json(dataset_path)
            elif format_type == '.parquet':
                return pd.read_parquet(dataset_path)
            elif format_type == '.xlsx':
                return pd.read_excel(dataset_path)
            else:
                raise ValidationError(f"Format {format_type} not implemented", self.name)
                
        except Exception as e:
            raise ProcessorError(f"Failed to load dataset: {str(e)}", self.name)
    
    async def _preprocess_dataset(self, dataset: pd.DataFrame, config: Dict[str, Any]) -> pd.DataFrame:
        """Apply preprocessing transformations"""
        
        processed = dataset.copy()
        
        # Handle missing values
        missing_strategy = config.get('missing_values', 'drop')
        if missing_strategy == 'drop':
            processed = processed.dropna()
        elif missing_strategy == 'fill_mean':
            numeric_columns = processed.select_dtypes(include=[np.number]).columns
            processed[numeric_columns] = processed[numeric_columns].fillna(processed[numeric_columns].mean())
        elif missing_strategy == 'fill_median':
            numeric_columns = processed.select_dtypes(include=[np.number]).columns
            processed[numeric_columns] = processed[numeric_columns].fillna(processed[numeric_columns].median())
        elif missing_strategy == 'fill_mode':
            processed = processed.fillna(processed.mode().iloc[0])
        
        # Remove duplicates
        if config.get('remove_duplicates', False):
            processed = processed.drop_duplicates()
        
        # Apply column filters
        if 'selected_columns' in config:
            selected_columns = config['selected_columns']
            if isinstance(selected_columns, list) and selected_columns:
                available_columns = [col for col in selected_columns if col in processed.columns]
                processed = processed[available_columns]
        
        # Data type conversions
        if 'column_types' in config:
            for column, dtype in config['column_types'].items():
                if column in processed.columns:
                    try:
                        processed[column] = processed[column].astype(dtype)
                    except Exception as e:
                        logger.warning(f"Could not convert {column} to {dtype}: {str(e)}")
        
        # Normalization/Scaling
        scaling_method = config.get('scaling_method')
        if scaling_method and scaling_method != 'none':
            numeric_columns = processed.select_dtypes(include=[np.number]).columns
            
            if scaling_method == 'standard':
                from sklearn.preprocessing import StandardScaler
                scaler = StandardScaler()
                processed[numeric_columns] = scaler.fit_transform(processed[numeric_columns])
            elif scaling_method == 'minmax':
                from sklearn.preprocessing import MinMaxScaler
                scaler = MinMaxScaler()
                processed[numeric_columns] = scaler.fit_transform(processed[numeric_columns])
            elif scaling_method == 'robust':
                from sklearn.preprocessing import RobustScaler
                scaler = RobustScaler()
                processed[numeric_columns] = scaler.fit_transform(processed[numeric_columns])
        
        return processed
    
    async def _extract_features_target(self, dataset: pd.DataFrame, config: Dict[str, Any]) -> tuple:
        """Extract features and target variables"""
        
        target_column = config.get('target_column')
        feature_columns = config.get('feature_columns')
        
        if target_column:
            if target_column not in dataset.columns:
                raise ValidationError(f"Target column '{target_column}' not found in dataset", self.name)
            target = dataset[target_column]
            features = dataset.drop(columns=[target_column])
        else:
            target = None
            features = dataset
        
        # Select specific feature columns if specified
        if feature_columns and isinstance(feature_columns, list):
            available_features = [col for col in feature_columns if col in features.columns]
            if available_features:
                features = features[available_features]
        
        return features, target
    
    async def _generate_metadata(self, dataset: pd.DataFrame, features: pd.DataFrame, target: Optional[pd.Series]) -> Dict[str, Any]:
        """Generate dataset metadata"""
        
        metadata = {
            "shape": dataset.shape,
            "columns": list(dataset.columns),
            "dtypes": {col: str(dtype) for col, dtype in dataset.dtypes.items()},
            "missing_values": dataset.isnull().sum().to_dict(),
            "memory_usage": dataset.memory_usage(deep=True).sum(),
            "feature_count": len(features.columns) if features is not None else 0,
            "has_target": target is not None,
        }
        
        # Add basic statistics for numeric columns
        numeric_columns = dataset.select_dtypes(include=[np.number]).columns
        if len(numeric_columns) > 0:
            metadata["numeric_stats"] = dataset[numeric_columns].describe().to_dict()
        
        # Add categorical column info
        categorical_columns = dataset.select_dtypes(include=['object', 'category']).columns
        if len(categorical_columns) > 0:
            metadata["categorical_info"] = {}
            for col in categorical_columns:
                metadata["categorical_info"][col] = {
                    "unique_count": dataset[col].nunique(),
                    "top_values": dataset[col].value_counts().head(5).to_dict()
                }
        
        # Target variable info
        if target is not None:
            metadata["target_info"] = {
                "name": target.name,
                "type": str(target.dtype),
                "unique_count": target.nunique(),
            }
            
            if target.dtype in ['object', 'category']:
                metadata["target_info"]["class_distribution"] = target.value_counts().to_dict()
            else:
                metadata["target_info"]["statistics"] = target.describe().to_dict()
        
        return metadata

    def validate_inputs(self, node_data: Dict[str, Any], context: Dict[str, Any]) -> bool:
        """Validate dataset processor inputs"""
        
        node_config = node_data.get('data', {})
        dataset_path = node_config.get('dataset_path') or node_config.get('selectedFile', {}).get('path')
        
        if not dataset_path:
            return False
        
        # Check if file exists (if it's a local path)
        if isinstance(dataset_path, str) and not dataset_path.startswith('http'):
            path = Path(dataset_path)
            if not path.exists():
                logger.error(f"Dataset file not found: {dataset_path}")
                return False
        
        return True
