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

// Debug utility function
const debugLog = (component: string, action: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${component}] ${action}`, data || '');
};

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
      { id: 'data-cleaner', icon: Settings, title: 'Data Cleaner', description: 'Clean and preprocess data' },
      { id: 'frame-extractor', icon: Image, title: 'Frame Extractor', description: 'Extract frames from video' },
      { id: 'augmentation', icon: Zap, title: 'Data Augmentation', description: 'Augment training data' },
      { id: 'train-split', icon: GitBranch, title: 'Train/Val Split', description: 'Split data for training' },
    ]
  },
  {
    id: 'ml-training',
    title: 'ML Training',
    icon: Brain,
    color: 'bg-purple-500',
    nodes: [
      { id: 'object-detection', icon: Target, title: 'Object Detection', description: 'YOLO/Detectron2 training' },
      { id: 'model-trainer', icon: Brain, title: 'Model Trainer', description: 'General ML training' },
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
      { id: 'model-evaluator', icon: BarChart3, title: 'Model Evaluator', description: 'Calculate metrics (mAP, accuracy)' },
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
  debugLog('FloatingComponentsPanel', 'Component rendered');
  
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    debugLog('FloatingComponentsPanel', 'Toggling category', { 
      categoryId, 
      currentlyExpanded: expandedCategories.has(categoryId) 
    });
    
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleNodeDragStart = (event: React.DragEvent, nodeType: string) => {
    debugLog('FloatingComponentsPanel', 'Node drag started', { 
      nodeType, 
      clientX: event.clientX, 
      clientY: event.clientY 
    });
    onNodeDrag(event, nodeType);
  };

  debugLog('FloatingComponentsPanel', 'Rendering panel', { 
    expandedCategories: Array.from(expandedCategories),
    totalCategories: componentCategories.length
  });

  return (
    <div className="absolute left-4 top-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-64 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Components
        </h3>
        
        <div className="space-y-2">
          {componentCategories.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            const IconComponent = category.icon;
            
            return (
              <div key={category.id} className="border border-gray-200 dark:border-gray-600 rounded-lg">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-t-lg"
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${category.color}`} />
                    <IconComponent className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {category.title}
                    </span>
                  </div>
                  <div className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-1">
                    {category.nodes.map((node) => {
                      const NodeIcon = node.icon;
                      
                      return (
                        <div
                          key={node.id}
                          draggable
                          onDragStart={(e) => handleNodeDragStart(e, node.id)}
                          className="flex items-center space-x-2 px-2 py-1 rounded cursor-move hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <NodeIcon className="w-4 h-4 text-gray-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                              {node.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {node.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FloatingComponentsPanel;
