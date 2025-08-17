import React, { useState } from 'react';
import { 
  Database,
  Camera,
  Image,
  FileText,
  Brain,
  Target,
  BarChart3,
  Upload,
  Download,
  Cpu,
  Activity,
  Clock,
  Zap,
  Settings,
  Eye,
  Globe,
  GitBranch,
  Bell
} from 'lucide-react';

interface FloatingComponentsPanelProps {
  onNodeDrag: (event: React.DragEvent, nodeType: string) => void;
}

const componentCategories = [
  {
    id: 'data-sources',
    title: 'Data Sources',
    icon: Database,
    color: 'bg-blue-500',
    nodes: [
      { id: 'dataset-upload', icon: Upload, title: 'Dataset Upload', description: 'Upload training datasets' },
      { id: 'dataset-sample', icon: Database, title: 'Sample Dataset', description: 'Load built-in sample datasets' },
      { id: 'video-stream', icon: Camera, title: 'Video Stream', description: 'Stream videos from files or cameras' },
      { id: 'database', icon: Database, title: 'Database', description: 'Connect to databases' },
      { id: 'file-storage', icon: FileText, title: 'File Storage', description: 'Cloud storage connector' },
    ]
  },
  {
    id: 'data-processing',
    title: 'Data Processing',
    icon: Settings,
    color: 'bg-green-500',
    nodes: [
      { id: 'data-preprocessing', icon: Settings, title: 'Data Preprocessing', description: 'Clean and preprocess data' },
      { id: 'data-split', icon: GitBranch, title: 'Train-Test Split', description: 'Split data for training & testing' },
      { id: 'data-cleaner', icon: Settings, title: 'Data Cleaner', description: 'Legacy cleaner (optional)' },
      { id: 'frame-extractor', icon: Image, title: 'Frame Extractor', description: 'Extract frames from video' },
      { id: 'augmentation', icon: Zap, title: 'Data Augmentation', description: 'Augment training data' },
    ]
  },
  {
    id: 'ml-training',
    title: 'ML Training',
    icon: Brain,
    color: 'bg-purple-500',
    nodes: [
      { id: 'linear-regression', icon: BarChart3, title: 'Linear Regression', description: 'Train linear regression' },
      { id: 'random-forest', icon: Brain, title: 'Random Forest', description: 'Train random forest' },
      { id: 'svm-classifier', icon: Target, title: 'SVM Classifier', description: 'Train SVM classifier' },
      { id: 'model-trainer', icon: Brain, title: 'Model Trainer', description: 'Generic trainer (legacy)' },
      { id: 'transfer-learning', icon: Cpu, title: 'Transfer Learning', description: 'Pre-trained model fine-tuning' },
      { id: 'hyperparameter', icon: Settings, title: 'Hyperparameter Tuning', description: 'Optimize model parameters' },
    ]
  },
  {
    id: 'evaluation',
    title: 'Evaluation',
    icon: BarChart3,
    color: 'bg-orange-500',
    nodes: [
      { id: 'model-evaluation', icon: BarChart3, title: 'Model Evaluation', description: 'Evaluate model performance' },
      { id: 'confusion-matrix', icon: BarChart3, title: 'Confusion Matrix', description: 'Build confusion matrix' },
      { id: 'results-visualization', icon: BarChart3, title: 'Results Visualization', description: 'Visualize metrics' },
      { id: 'model-evaluator', icon: BarChart3, title: 'Model Evaluator', description: 'Calculate metrics (legacy)' },
      { id: 'performance-monitor', icon: Activity, title: 'Performance Monitor', description: 'Monitor model performance' },
      { id: 'model-validator', icon: Eye, title: 'Model Validator', description: 'Validate model outputs' },
    ]
  },
  {
    id: 'deployment',
    title: 'Deployment',
    icon: Download,
    color: 'bg-red-500',
    nodes: [
      { id: 'model-export', icon: Download, title: 'Model Export', description: 'Export trained models' },
      { id: 'model-deploy', icon: Zap, title: 'Model Deploy', description: 'Deploy to production' },
      { id: 'api-endpoint', icon: Globe, title: 'API Endpoint', description: 'Create inference API' },
    ]
  },
  {
    id: 'automation',
    title: 'Automation',
    icon: Clock,
    color: 'bg-yellow-500',
    nodes: [
      { id: 'scheduler', icon: Clock, title: 'Scheduler', description: 'Schedule retraining' },
      { id: 'trigger-performance', icon: Activity, title: 'Performance Trigger', description: 'Auto-retrain on metrics' },
      { id: 'alert', icon: Bell, title: 'Alert', description: 'Send notifications' },
    ]
  }
];

const FloatingComponentsPanel: React.FC<FloatingComponentsPanelProps> = ({ onNodeDrag }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) newExpanded.delete(categoryId);
    else newExpanded.add(categoryId);
    setExpandedCategories(newExpanded);
  };

  const handleNodeDragStart = (event: React.DragEvent, nodeType: string) => {
    onNodeDrag(event, nodeType);
    setTimeout(() => setExpandedCategories(new Set()), 100);
  };

  return (
    <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        {componentCategories.map((category, index) => {
          const CategoryIcon = category.icon;
          const isExpanded = expandedCategories.has(category.id);

          return (
            <div key={category.id} className="relative">
              <button
                onClick={() => toggleCategory(category.id)}
                className={`
                  w-16 h-16 flex items-center justify-center
                  hover:bg-gray-50 dark:hover:bg-gray-700
                  transition-colors duration-200
                  ${index === 0 ? 'rounded-t-lg' : ''}
                  ${index === componentCategories.length - 1 && !isExpanded ? 'rounded-b-lg' : ''}
                  ${isExpanded ? 'bg-gray-50 dark:bg-gray-700' : ''}
                `}
                title={category.title}
              >
                <div className={`w-8 h-8 ${category.color} rounded-lg flex items-center justify-center`}>
                  <CategoryIcon className="w-4 h-4 text-white" />
                </div>
              </button>

              {isExpanded && (
                <div className="absolute left-full top-0 ml-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      {category.title}
                    </h3>
                    <div className="space-y-2">
                      {category.nodes.map((node) => {
                        const NodeIcon = node.icon;
                        return (
                          <div
                            key={node.id}
                            draggable
                            onDragStart={(event) => handleNodeDragStart(event, node.id)}
                            className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-move transition-colors group"
                          >
                            <div className={`w-10 h-10 ${category.color} rounded-lg flex items-center justify-center mr-3`}>
                              <NodeIcon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {node.title}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {node.description}
                              </p>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                                Drag
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FloatingComponentsPanel;
