// frontend/src/components/PropertiesPanel/NodeConfigurators/factory.ts

import { FC } from 'react';
import VideoStreamConfigurator from './DataSource/VideoStreamConfigurator';
import DatasetUploadConfigurator from './DataSource/DatasetUploadConfigurator';

import RandomForestConfigurator from './MLTraining/RandomForestConfigurator';
import LinearRegressionConfigurator from './MLTraining/LinearRegressionConfigurator';
import SVMClassifierConfigurator from './MLTraining/SVMClassifierConfigurator';
import DataSplitConfigurator from './DataProcessing/DataSplitConfigurator';

import DatabaseConfigurator from './DataSource/DatabaseConfigurator';
import ModelEvaluationConfigurator from './Evaluation/ModelEvaluationConfigurator';
import DataPreprocessingConfigurator from './DataProcessing/DataPreprocessingConfigurator';
import ModelExportConfigurator from './Automation/Deployment/ModelExportConfigurator';

import APIEndpointConfigurator from './Automation/Deployment/APIEndpointConfigurator';
import HyperparameterConfigurator from './MLTraining/HyperparameterConfigurator';
import TransferLearningConfigurator from './MLTraining/TransferLearningConfigurator';
import PerformanceMonitorConfigurator from './Evaluation/PerformanceMonitorConfigurator';

import ModelTrainerConfigurator from './MLTraining/ModelTrainerConfigurator';
import ConfusionMatrixConfigurator from './Evaluation/ConfusionMatrixConfigurator';
import FileStorageConfigurator from './DataSource/FileStorageConfigurator';
import ModelDeployConfigurator from './Automation/Deployment/ModelDeployConfigurator';
import SchedulerConfigurator from './Automation/SchedulerConfigurator';
import DataCleanerConfigurator from './DataProcessing/DataCleanerConfigurator';
import FrameExtractorConfigurator from './DataProcessing/FrameExtractorConfigurator';
import AugmentationConfigurator from './DataProcessing/AugmentationConfigurator';
import ResultsVisualizationConfigurator from './Evaluation/ResultsVisualizationConfigurator';
import ModelEvaluatorConfigurator from './Evaluation/ModelEvaluatorConfigurator';
import ModelValidatorConfigurator from './Evaluation/ModelValidatorConfigurator';
import PerformanceTriggerConfigurator from './Automation/PerformanceTriggerConfigurator';
import AlertConfigurator from './Automation/AlertConfigurator';

import GenericConfigurator from './GenericConfigurator';

const configuratorMap: Record<string, FC<any>> = {
  'video-stream': VideoStreamConfigurator,
  'dataset-upload': DatasetUploadConfigurator,

  'random-forest': RandomForestConfigurator,
  'linear-regression': LinearRegressionConfigurator,
  'svm-classifier': SVMClassifierConfigurator,
  'data-split': DataSplitConfigurator,

  'database': DatabaseConfigurator,
  'model-evaluation': ModelEvaluationConfigurator,
  'data-preprocessing': DataPreprocessingConfigurator,
  'model-export': ModelExportConfigurator,
  
  'api-endpoint': APIEndpointConfigurator,
  'hyperparameter': HyperparameterConfigurator,
  'transfer-learning': TransferLearningConfigurator,
  'performance-monitor': PerformanceMonitorConfigurator,
  
  'model-trainer': ModelTrainerConfigurator,
  'confusion-matrix': ConfusionMatrixConfigurator,
  'file-storage': FileStorageConfigurator,
  'model-deploy': ModelDeployConfigurator,
  'scheduler': SchedulerConfigurator,
  'data-cleaner': DataCleanerConfigurator,
  'frame-extractor': FrameExtractorConfigurator,
  'augmentation': AugmentationConfigurator,
  'results-visualization': ResultsVisualizationConfigurator,
  'model-evaluator': ModelEvaluatorConfigurator,
  'model-validator': ModelValidatorConfigurator,
  'trigger-performance': PerformanceTriggerConfigurator,
  'alert': AlertConfigurator,
};

// Factory to retrieve configurator
export class NodeConfiguratorFactory {
  static getConfigurator(nodeType: string): FC<any> {
    return configuratorMap[nodeType] || GenericConfigurator;
  }
}
