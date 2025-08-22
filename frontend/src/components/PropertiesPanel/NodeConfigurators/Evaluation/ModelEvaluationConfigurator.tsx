// frontend/src/components/PropertiesPanel/NodeConfigurators/ModelEvaluationConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { BarChart3 } from 'lucide-react';
import TextInput from '../../../Shared/TextInput';
import SelectInput from '../../../Shared/SelectInput';
import CheckboxInput from '../../../Shared/CheckboxInput';
import NumberInput from '../../../Shared/NumberInput';

interface ConfiguratorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, newData: any) => void;
}

const ModelEvaluationConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [evaluationMethod, setEvaluationMethod] = useState(node.data.parameters?.evaluationMethod || 'holdout');
  const [crossValidationFolds, setCrossValidationFolds] = useState(node.data.parameters?.crossValidationFolds || 5);
  const [metrics, setMetrics] = useState<string[]>(node.data.parameters?.metrics || ['accuracy', 'precision', 'recall', 'f1_score']);
  const [averageMethod, setAverageMethod] = useState(node.data.parameters?.averageMethod || 'weighted');
  const [randomState, setRandomState] = useState(node.data.parameters?.randomState || 42);
  const [saveReports, setSaveReports] = useState(node.data.parameters?.saveReports ?? true);
  const [generatePlots, setGeneratePlots] = useState(node.data.parameters?.generatePlots ?? true);
  const [verbose, setVerbose] = useState(node.data.parameters?.verbose || false);

  // Sync with node data on node change
  useEffect(() => {
    setNodeName(node.data.label || '');
    const params = node.data.parameters || {};
    setEvaluationMethod(params.evaluationMethod || 'holdout');
    setCrossValidationFolds(params.crossValidationFolds || 5);
    setMetrics(params.metrics || ['accuracy', 'precision', 'recall', 'f1_score']);
    setAverageMethod(params.averageMethod || 'weighted');
    setRandomState(params.randomState || 42);
    setSaveReports(params.saveReports ?? true);
    setGeneratePlots(params.generatePlots ?? true);
    setVerbose(params.verbose || false);
  }, [node]);

  // Update node with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, {
        label: nodeName,
        parameters: {
          evaluationMethod,
          crossValidationFolds: evaluationMethod === 'cross_validation' ? crossValidationFolds : undefined,
          metrics,
          averageMethod,
          randomState,
          saveReports,
          generatePlots,
          verbose
        }
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, evaluationMethod, crossValidationFolds, metrics, averageMethod, randomState, saveReports, generatePlots, verbose, node.id, onNodeUpdate]);

  const evaluationMethodOptions = [
    { label: 'Holdout Validation', value: 'holdout' },
    { label: 'Cross Validation', value: 'cross_validation' },
    { label: 'Bootstrap', value: 'bootstrap' },
    { label: 'Leave-One-Out', value: 'loo' }
  ];

  const averageMethodOptions = [
    { label: 'Weighted', value: 'weighted' },
    { label: 'Macro', value: 'macro' },
    { label: 'Micro', value: 'micro' },
    { label: 'Binary', value: 'binary' }
  ];

  const availableMetrics = [
    'accuracy', 'precision', 'recall', 'f1_score', 
    'roc_auc', 'confusion_matrix', 'classification_report',
    'mse', 'mae', 'r2_score', 'rmse'
  ];

  const handleMetricChange = (metric: string, checked: boolean) => {
    if (checked) {
      setMetrics([...metrics, metric]);
    } else {
      setMetrics(metrics.filter(m => m !== metric));
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <BarChart3 className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Model Evaluation Configuration</h3>
      </div>

      <TextInput
        label="Node Name"
        value={nodeName}
        placeholder="Enter node name"
        onChange={setNodeName}
      />

      <SelectInput
        label="Evaluation Method"
        value={evaluationMethod}
        options={evaluationMethodOptions}
        onChange={setEvaluationMethod}
      />

      {evaluationMethod === 'cross_validation' && (
        <NumberInput
          label="Cross Validation Folds"
          value={crossValidationFolds}
          onChange={setCrossValidationFolds}
        />
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Evaluation Metrics
        </label>
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded p-2">
          {availableMetrics.map(metric => (
            <label key={metric} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={metrics.includes(metric)}
                onChange={(e) => handleMetricChange(metric, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">{metric.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      <SelectInput
        label="Average Method (for multi-class)"
        value={averageMethod}
        options={averageMethodOptions}
        onChange={setAverageMethod}
      />

      <NumberInput
        label="Random State"
        value={randomState}
        onChange={setRandomState}
      />

      <div className="space-y-3">
        <CheckboxInput
          label="Save Evaluation Reports"
          checked={saveReports}
          onChange={setSaveReports}
        />

        <CheckboxInput
          label="Generate Plots"
          checked={generatePlots}
          onChange={setGeneratePlots}
        />

        <CheckboxInput
          label="Verbose Output"
          checked={verbose}
          onChange={setVerbose}
        />
      </div>

      <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded">
        <p className="text-sm text-orange-800 dark:text-orange-200">
          <strong>Selected Metrics:</strong> {metrics.length > 0 ? metrics.join(', ') : 'None selected'}
        </p>
        <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
          <strong>Method:</strong> {evaluationMethodOptions.find(m => m.value === evaluationMethod)?.label}
        </p>
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <strong>Node ID:</strong> {node.id}
      </div>
    </div>
  );
};

export default ModelEvaluationConfigurator;
