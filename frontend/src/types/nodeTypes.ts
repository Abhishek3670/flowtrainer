export interface MLNodeData {
  id: string;
  type: string;
  label: string;
  parameters: Record<string, any>;
  inputs: string[];
  outputs: string[];
  validation?: {
    required: string[];
    optional?: string[];
  };
}

export const ML_NODE_TYPES: Record<string, MLNodeData> = {
  // Data Input Nodes
  'dataset-upload': {
    id: 'dataset-upload',
    type: 'dataset-upload',
    label: 'Upload Dataset',
    parameters: {
      file_path: '',
      file_type: 'csv', // csv, json, parquet
      separator: ',',
      has_header: true
    },
    inputs: [],
    outputs: ['dataset'],
    validation: {
      required: ['file_path']
    }
  },

  // Data Processing Nodes
  'data-split': {
    id: 'data-split',
    type: 'data-split',
    label: 'Train-Test Split',
    parameters: {
      test_size: 0.2,
      random_state: 42,
      stratify: true
    },
    inputs: ['dataset'],
    outputs: ['train_data', 'test_data'],
    validation: {
      required: ['test_size']
    }
  },

  'data-preprocessing': {
    id: 'data-preprocessing',
    type: 'data-preprocessing',
    label: 'Data Preprocessing',
    parameters: {
      scale_features: true,
      handle_missing: 'drop', // drop, fill, interpolate
      encode_categorical: true,
      remove_outliers: false
    },
    inputs: ['dataset'],
    outputs: ['processed_dataset'],
    validation: {
      required: []
    }
  },

  // ML Model Nodes
  'linear-regression': {
    id: 'linear-regression',
    type: 'linear-regression',
    label: 'Linear Regression',
    parameters: {
      fit_intercept: true,
      normalize: false
    },
    inputs: ['train_data'],
    outputs: ['model', 'predictions'],
    validation: {
      required: []
    }
  },

  'random-forest': {
    id: 'random-forest',
    type: 'random-forest',
    label: 'Random Forest',
    parameters: {
      n_estimators: 100,
      max_depth: 10,
      random_state: 42,
      min_samples_split: 2
    },
    inputs: ['train_data'],
    outputs: ['model', 'predictions'],
    validation: {
      required: ['n_estimators']
    }
  },

  'svm-classifier': {
    id: 'svm-classifier',
    type: 'svm-classifier',
    label: 'SVM Classifier',
    parameters: {
      kernel: 'rbf', // linear, poly, rbf, sigmoid
      C: 1.0,
      gamma: 'scale'
    },
    inputs: ['train_data'],
    outputs: ['model', 'predictions'],
    validation: {
      required: ['kernel']
    }
  },

  // Evaluation Nodes
  'model-evaluation': {
    id: 'model-evaluation',
    type: 'model-evaluation',
    label: 'Model Evaluation',
    parameters: {
      metrics: ['accuracy', 'precision', 'recall', 'f1_score'],
      cross_validation: true,
      cv_folds: 5
    },
    inputs: ['model', 'test_data'],
    outputs: ['evaluation_results'],
    validation: {
      required: ['metrics']
    }
  },

  'confusion-matrix': {
    id: 'confusion-matrix',
    type: 'confusion-matrix',
    label: 'Confusion Matrix',
    parameters: {
      normalize: false,
      display_labels: true
    },
    inputs: ['predictions', 'test_data'],
    outputs: ['confusion_matrix'],
    validation: {
      required: []
    }
  },

  // Output Nodes
  'model-export': {
    id: 'model-export',
    type: 'model-export',
    label: 'Export Model',
    parameters: {
      format: 'joblib', // joblib, pickle, onnx
      file_name: 'trained_model'
    },
    inputs: ['model'],
    outputs: ['model_file'],
    validation: {
      required: ['format', 'file_name']
    }
  },

  'results-visualization': {
    id: 'results-visualization',
    type: 'results-visualization',
    label: 'Results Visualization',
    parameters: {
      chart_type: 'bar', // bar, line, scatter, heatmap
      save_plot: true,
      plot_title: 'Model Results'
    },
    inputs: ['evaluation_results'],
    outputs: ['visualization'],
    validation: {
      required: ['chart_type']
    }
  }
};
