import pandas as pd
import numpy as np
import joblib
import json
import os
from pathlib import Path
from sklearn.datasets import load_iris, load_digits, load_wine
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.svm import SVC, SVR
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, 
    mean_squared_error, r2_score, confusion_matrix, classification_report
)
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime

class MLProcessor:
    def __init__(self, project_path: str):
        self.project_path = Path(project_path)
        self.project_path.mkdir(parents=True, exist_ok=True)
        self.data_cache = {}
        self.model_cache = {}
        
    def log_step(self, message: str, level: str = "INFO"):
        """Log execution steps"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
        
        # Also write to log file
        log_file = self.project_path / "logs" / "execution.log"
        log_file.parent.mkdir(exist_ok=True)
        with open(log_file, 'a') as f:
            f.write(f"[{timestamp}] [{level}] {message}\n")

    # Data Input Processors
    def process_dataset_upload(self, node_id: str, parameters: dict) -> dict:
        """Process uploaded dataset"""
        self.log_step(f"Processing dataset upload for node {node_id}")
        
        file_path = parameters.get('file_path', '')
        file_type = parameters.get('file_type', 'csv')
        
        try:
            if file_type == 'csv':
                separator = parameters.get('separator', ',')
                has_header = parameters.get('has_header', True)
                header = 0 if has_header else None
                df = pd.read_csv(file_path, sep=separator, header=header)
            elif file_type == 'json':
                df = pd.read_json(file_path)
            elif file_type == 'parquet':
                df = pd.read_parquet(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_type}")
                
            self.data_cache[f"{node_id}_dataset"] = df
            self.log_step(f"Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")
            
            return {
                'success': True,
                'outputs': {'dataset': f"{node_id}_dataset"},
                'metadata': {
                    'rows': int(df.shape),
                    'columns': int(df.shape),
                    'column_names': list(df.columns),
                    'data_types': {col: str(dtype) for col, dtype in df.dtypes.items()}
                }
            }
        except Exception as e:
            self.log_step(f"Error loading dataset: {str(e)}", "ERROR")
            return {'success': False, 'error': str(e)}

    def process_dataset_sample(self, node_id: str, parameters: dict) -> dict:
        """Process sample dataset"""
        self.log_step(f"Loading sample dataset for node {node_id}")
        
        dataset_type = parameters.get('dataset_type', 'iris')
        sample_size = parameters.get('sample_size', 1000)
        
        try:
            if dataset_type == 'iris':
                data = load_iris()
                df = pd.DataFrame(data.data, columns=data.feature_names)
                df['target'] = data.target
                target_names = data.target_names
                
            elif dataset_type == 'digits':
                data = load_digits()
                df = pd.DataFrame(data.data)
                df['target'] = data.target
                target_names = [str(i) for i in range(10)]
                
            elif dataset_type == 'wine':
                data = load_wine()
                df = pd.DataFrame(data.data, columns=data.feature_names)
                df['target'] = data.target
                target_names = data.target_names
                
            elif dataset_type == 'titanic':
                # Create synthetic Titanic-like data
                np.random.seed(42)
                n_samples = min(sample_size, 1000)
                df = pd.DataFrame({
                    'age': np.random.normal(30, 12, n_samples),
                    'fare': np.random.lognormal(3, 1, n_samples),
                    'pclass': np.random.choice([1, 2, 3], n_samples),
                    'sex': np.random.choice(['male', 'female'], n_samples),
                    'sibsp': np.random.poisson(0.5, n_samples),
                    'parch': np.random.poisson(0.3, n_samples),
                })
                # Create survival target based on realistic factors
                survival_prob = (
                    0.8 * (df['sex'] == 'female') +
                    0.6 * (df['pclass'] == 1) +
                    0.4 * (df['pclass'] == 2) +
                    0.2 * (df['pclass'] == 3) +
                    0.01 * (50 - df['age'].abs())
                )
                df['target'] = np.random.binomial(1, survival_prob.clip(0, 1), n_samples)
                target_names = ['died', 'survived']
                
            elif dataset_type == 'housing':
                # Create synthetic housing data
                np.random.seed(42)
                n_samples = min(sample_size, 1000)
                df = pd.DataFrame({
                    'rooms': np.random.normal(6, 2, n_samples),
                    'age': np.random.uniform(1, 100, n_samples),
                    'distance': np.random.exponential(3, n_samples),
                    'crime_rate': np.random.exponential(0.5, n_samples),
                    'tax_rate': np.random.normal(400, 100, n_samples),
                })
                # Create price target
                df['target'] = (
                    df['rooms'] * 50000 +
                    (100 - df['age']) * 1000 +
                    df['distance'] * -10000 +
                    df['crime_rate'] * -20000 +
                    df['tax_rate'] * -100 +
                    np.random.normal(0, 50000, n_samples)
                ).clip(50000, 1000000)
                target_names = ['price']
            else:
                raise ValueError(f"Unknown dataset type: {dataset_type}")
            
            # Sample if needed
            if len(df) > sample_size:
                df = df.sample(n=sample_size, random_state=42)
            
            self.data_cache[f"{node_id}_dataset"] = df
            self.log_step(f"Sample dataset '{dataset_type}' loaded: {df.shape[0]} rows, {df.shape[1]} columns")
            
            return {
                'success': True,
                'outputs': {'dataset': f"{node_id}_dataset"},
                'metadata': {
                    'dataset_type': dataset_type,
                    'rows': int(df.shape),
                    'columns': int(df.shape),
                    'target_names': target_names,
                    'sample_data': df.head().to_dict('records')
                }
            }
        except Exception as e:
            self.log_step(f"Error loading sample dataset: {str(e)}", "ERROR")
            return {'success': False, 'error': str(e)}

    # Data Processing Processors
    def process_data_split(self, node_id: str, parameters: dict, inputs: dict) -> dict:
        """Process train-test split"""
        self.log_step(f"Splitting data for node {node_id}")
        
        try:
            dataset_key = inputs.get('dataset')
            if not dataset_key or dataset_key not in self.data_cache:
                raise ValueError("Input dataset not found")
                
            df = self.data_cache[dataset_key]
            test_size = parameters.get('test_size', 0.2)
            random_state = parameters.get('random_state', 42)
            stratify = parameters.get('stratify', True)
            
            # Separate features and target
            if 'target' in df.columns:
                X = df.drop('target', axis=1)
                y = df['target']
                stratify_param = y if stratify and len(y.unique()) > 1 else None
            else:
                X = df
                y = None
                stratify_param = None
                
            if y is not None:
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=test_size, random_state=random_state, stratify=stratify_param
                )
                train_data = pd.concat([X_train, y_train], axis=1)
                test_data = pd.concat([X_test, y_test], axis=1)
            else:
                X_train, X_test = train_test_split(
                    X, test_size=test_size, random_state=random_state
                )
                train_data = X_train
                test_data = X_test
            
            train_key = f"{node_id}_train_data"
            test_key = f"{node_id}_test_data"
            
            self.data_cache[train_key] = train_data
            self.data_cache[test_key] = test_data
            
            self.log_step(f"Data split completed: {len(train_data)} train, {len(test_data)} test samples")
            
            return {
                'success': True,
                'outputs': {
                    'train_data': train_key,
                    'test_data': test_key
                },
                'metadata': {
                    'train_samples': int(len(train_data)),
                    'test_samples': int(len(test_data)),
                    'test_ratio': test_size
                }
            }
        except Exception as e:
            self.log_step(f"Error in data split: {str(e)}", "ERROR")
            return {'success': False, 'error': str(e)}

    def process_data_preprocessing(self, node_id: str, parameters: dict, inputs: dict) -> dict:
        """Process data preprocessing"""
        self.log_step(f"Preprocessing data for node {node_id}")
        
        try:
            dataset_key = inputs.get('dataset')
            if not dataset_key or dataset_key not in self.data_cache:
                raise ValueError("Input dataset not found")
                
            df = self.data_cache[dataset_key].copy()
            
            scale_features = parameters.get('scale_features', True)
            handle_missing = parameters.get('handle_missing', 'drop')
            encode_categorical = parameters.get('encode_categorical', True)
            remove_outliers = parameters.get('remove_outliers', False)
            
            processing_steps = []
            
            # Handle missing values
            if handle_missing == 'drop':
                initial_rows = len(df)
                df = df.dropna()
                processing_steps.append(f"Dropped {initial_rows - len(df)} rows with missing values")
            elif handle_missing == 'fill':
                numeric_cols = df.select_dtypes(include=[np.number]).columns
                categorical_cols = df.select_dtypes(include=['object']).columns
                df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())
                df[categorical_cols] = df[categorical_cols].fillna(df[categorical_cols].mode().iloc[0])
                processing_steps.append("Filled missing values with mean/mode")
                
            # Encode categorical variables
            if encode_categorical:
                categorical_cols = df.select_dtypes(include=['object']).columns
                categorical_cols = [col for col in categorical_cols if col != 'target']
                
                for col in categorical_cols:
                    le = LabelEncoder()
                    df[col] = le.fit_transform(df[col].astype(str))
                    processing_steps.append(f"Encoded categorical column: {col}")
            
            # Scale features
            if scale_features and 'target' in df.columns:
                feature_cols = [col for col in df.columns if col != 'target']
                scaler = StandardScaler()
                df[feature_cols] = scaler.fit_transform(df[feature_cols])
                processing_steps.append("Scaled features using StandardScaler")
                
                # Save scaler for later use
                scaler_path = self.project_path / f"{node_id}_scaler.joblib"
                joblib.dump(scaler, scaler_path)
            
            # Remove outliers (simple IQR method)
            if remove_outliers:
                numeric_cols = df.select_dtypes(include=[np.number]).columns
                numeric_cols = [col for col in numeric_cols if col != 'target']
                
                initial_rows = len(df)
                for col in numeric_cols:
                    Q1 = df[col].quantile(0.25)
                    Q3 = df[col].quantile(0.75)
                    IQR = Q3 - Q1
                    lower = Q1 - 1.5 * IQR
                    upper = Q3 + 1.5 * IQR
                    df = df[(df[col] >= lower) & (df[col] <= upper)]
                
                processing_steps.append(f"Removed {initial_rows - len(df)} outliers")
            
            processed_key = f"{node_id}_processed_dataset"
            self.data_cache[processed_key] = df
            
            self.log_step(f"Preprocessing completed: {len(processing_steps)} steps applied")
            
            return {
                'success': True,
                'outputs': {'processed_dataset': processed_key},
                'metadata': {
                    'final_shape': list(df.shape),
                    'processing_steps': processing_steps,
                    'columns': list(df.columns)
                }
            }
        except Exception as e:
            self.log_step(f"Error in preprocessing: {str(e)}", "ERROR")
            return {'success': False, 'error': str(e)}

    # Continue with ML Model Processors...
