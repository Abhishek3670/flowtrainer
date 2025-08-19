import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { ML_NODE_TYPES } from '../../types/nodeTypes';
import { Settings, Play, AlertCircle } from 'lucide-react';

interface NodeConfigPanelProps {
  node: Node | null;
  onNodeUpdate: (nodeId: string, data: any) => void;
  onClose: () => void;
}

export default function NodeConfigPanel({ node, onNodeUpdate, onClose }: NodeConfigPanelProps) {
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (node) {
      const nodeType = ML_NODE_TYPES[node.data.type];
      setParameters(node.data.parameters || nodeType?.parameters || {});
    }
  }, [node]);

  if (!node) return null;

  const nodeType = ML_NODE_TYPES[node.data.type];
  if (!nodeType) return null;

  const handleParameterChange = (key: string, value: any) => {
    const newParameters = { ...parameters, [key]: value };
    setParameters(newParameters);
    
    // Validate parameters
    const newErrors: string[] = [];
    if (nodeType.validation?.required) {
      nodeType.validation.required.forEach(requiredField => {
        if (!newParameters[requiredField] || newParameters[requiredField] === '') {
          newErrors.push(`${requiredField} is required`);
        }
      });
    }
    setErrors(newErrors);

    // Update node with new parameters
    onNodeUpdate(node.id, {
      ...node.data,
      parameters: newParameters,
      isValid: newErrors.length === 0
    });
  };

  const renderParameterInput = (key: string, value: any) => {
    const inputType = typeof value;
    
    switch (inputType) {
      case 'boolean':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleParameterChange(key, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{key.replace(/_/g, ' ')}</span>
          </label>
        );
      
      case 'number':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {key.replace(/_/g, ' ')}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => handleParameterChange(key, parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        );
      
      default:
        // Handle specific field types
        if (key === 'dataset_type') {
          return (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dataset Type
              </label>
              <select
                value={value}
                onChange={(e) => handleParameterChange(key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="iris">Iris Classification</option>
                <option value="titanic">Titanic Survival</option>
                <option value="housing">Boston Housing</option>
                <option value="digits">Handwritten Digits</option>
              </select>
            </div>
          );
        }
        
        if (key === 'metrics' && Array.isArray(value)) {
          const availableMetrics = ['accuracy', 'precision', 'recall', 'f1_score', 'roc_auc'];
          return (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Evaluation Metrics
              </label>
              {availableMetrics.map(metric => (
                <label key={metric} className="flex items-center space-x-2 mb-1">
                  <input
                    type="checkbox"
                    checked={value.includes(metric)}
                    onChange={(e) => {
                      const newMetrics = e.target.checked 
                        ? [...value, metric]
                        : value.filter((m: string) => m !== metric);
                      handleParameterChange(key, newMetrics);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{metric}</span>
                </label>
              ))}
            </div>
          );
        }
        
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {key.replace(/_/g, ' ')}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleParameterChange(key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        );
    }
  };

  return (
    <div className="fixed right-0 top-16 h-full w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg z-40 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {nodeType.label}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      {/* Configuration Form */}
      <div className="p-4 space-y-4">
        {/* Node Info */}
        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <div><strong>Type:</strong> {nodeType.type}</div>
            <div><strong>Inputs:</strong> {nodeType.inputs.join(', ') || 'None'}</div>
            <div><strong>Outputs:</strong> {nodeType.outputs.join(', ')}</div>
          </div>
        </div>

        {/* Validation Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800 dark:text-red-200">Configuration Errors</span>
            </div>
            <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Parameters */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">Parameters</h4>
          {Object.entries(parameters).map(([key, value]) => (
            <div key={key}>
              {renderParameterInput(key, value)}
            </div>
          ))}
        </div>

        {/* Node Status */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${errors.length === 0 ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              {errors.length === 0 ? 'Ready to Execute' : 'Configuration Required'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
