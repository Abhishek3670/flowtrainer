// frontend/src/components/PropertiesPanel/NodeConfigurators/ModelEvaluatorConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { BarChart3 } from 'lucide-react';
import TextInput from '../../../Shared/TextInput';
import SelectInput from '../../../Shared/SelectInput';
import CheckboxInput from '../../../Shared/CheckboxInput';

interface ConfiguratorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, newData: any) => void;
}

const ModelEvaluatorConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [evaluationMetrics, setEvaluationMetrics] = useState<string[]>(node.data.parameters?.evaluationMetrics || ['accuracy', 'f1_score']);
  const [outputFormat, setOutputFormat] = useState(node.data.parameters?.outputFormat || 'json');
  const [saveResults, setSaveResults] = useState(node.data.parameters?.saveResults ?? true);
  const [detailedReport, setDetailedReport] = useState(node.data.parameters?.detailedReport ?? true);
  const [includeConfidenceScores, setIncludeConfidenceScores] = useState(node.data.parameters?.includeConfidenceScores || false);

  useEffect(() => {
    setNodeName(node.data.label || '');
    const params = node.data.parameters || {};
    setEvaluationMetrics(params.evaluationMetrics || ['accuracy', 'f1_score']);
    setOutputFormat(params.outputFormat || 'json');
    setSaveResults(params.saveResults ?? true);
    setDetailedReport(params.detailedReport ?? true);
    setIncludeConfidenceScores(params.includeConfidenceScores || false);
  }, [node]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, {
        label: nodeName,
        parameters: {
          evaluationMetrics,
          outputFormat,
          saveResults,
          detailedReport,
          includeConfidenceScores
        }
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, evaluationMetrics, outputFormat, saveResults, detailedReport, includeConfidenceScores, node.id, onNodeUpdate]);

  const availableMetrics = ['accuracy', 'precision', 'recall', 'f1_score', 'roc_auc', 'confusion_matrix'];
  const formatOptions = [
    { label: 'JSON', value: 'json' },
    { label: 'CSV', value: 'csv' },
    { label: 'Excel', value: 'xlsx' },
    { label: 'Text', value: 'txt' }
  ];

  const handleMetricChange = (metric: string, checked: boolean) => {
    if (checked) {
      setEvaluationMetrics([...evaluationMetrics, metric]);
    } else {
      setEvaluationMetrics(evaluationMetrics.filter(m => m !== metric));
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <BarChart3 className="h-5 w-5 text-teal-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Model Evaluator Configuration</h3>
      </div>

      <TextInput
        label="Node Name"
        value={nodeName}
        placeholder="Enter node name"
        onChange={setNodeName}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Evaluation Metrics
        </label>
        <div className="grid grid-cols-2 gap-2 border border-gray-300 dark:border-gray-600 rounded p-2">
          {availableMetrics.map(metric => (
            <label key={metric} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={evaluationMetrics.includes(metric)}
                onChange={(e) => handleMetricChange(metric, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">{metric.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      <SelectInput
        label="Output Format"
        value={outputFormat}
        options={formatOptions}
        onChange={setOutputFormat}
      />

      <div className="space-y-3">
        <CheckboxInput
          label="Save Results to File"
          checked={saveResults}
          onChange={setSaveResults}
        />

        <CheckboxInput
          label="Generate Detailed Report"
          checked={detailedReport}
          onChange={setDetailedReport}
        />

        <CheckboxInput
          label="Include Confidence Scores"
          checked={includeConfidenceScores}
          onChange={setIncludeConfidenceScores}
        />
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <strong>Node ID:</strong> {node.id}
      </div>
    </div>
  );
};

export default ModelEvaluatorConfigurator;