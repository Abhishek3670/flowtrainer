// frontend/src/components/PropertiesPanel/NodeConfigurators/ModelValidatorConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Eye } from 'lucide-react';
import TextInput from '../../../Shared/TextInput';
import SelectInput from '../../../Shared/SelectInput';
import CheckboxInput from '../../../Shared/CheckboxInput';

interface ConfiguratorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, newData: any) => void;
}

const ModelValidatorConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [validationRules, setValidationRules] = useState<string[]>(node.data.parameters?.validationRules || ['accuracy_threshold']);
  const [accuracyThreshold, setAccuracyThreshold] = useState(node.data.parameters?.accuracyThreshold || 0.8);
  const [onFailureAction, setOnFailureAction] = useState(node.data.parameters?.onFailureAction || 'warn');
  const [generateReport, setGenerateReport] = useState(node.data.parameters?.generateReport ?? true);

  useEffect(() => {
    setNodeName(node.data.label || '');
    const params = node.data.parameters || {};
    setValidationRules(params.validationRules || ['accuracy_threshold']);
    setAccuracyThreshold(params.accuracyThreshold || 0.8);
    setOnFailureAction(params.onFailureAction || 'warn');
    setGenerateReport(params.generateReport ?? true);
  }, [node]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, {
        label: nodeName,
        parameters: {
          validationRules,
          accuracyThreshold,
          onFailureAction,
          generateReport
        }
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, validationRules, accuracyThreshold, onFailureAction, generateReport, node.id, onNodeUpdate]);

  const availableRules = ['accuracy_threshold', 'precision_threshold', 'recall_threshold', 'data_drift'];
  const actionOptions = [
    { label: 'Warning Only', value: 'warn' },
    { label: 'Stop Pipeline', value: 'stop' },
    { label: 'Retrain Model', value: 'retrain' }
  ];

  const handleRuleChange = (rule: string, checked: boolean) => {
    if (checked) {
      setValidationRules([...validationRules, rule]);
    } else {
      setValidationRules(validationRules.filter(r => r !== rule));
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Eye className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Model Validator Configuration</h3>
      </div>

      <TextInput
        label="Node Name"
        value={nodeName}
        placeholder="Enter node name"
        onChange={setNodeName}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Validation Rules
        </label>
        <div className="grid grid-cols-2 gap-2 border border-gray-300 dark:border-gray-600 rounded p-2">
          {availableRules.map(rule => (
            <label key={rule} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={validationRules.includes(rule)}
                onChange={(e) => handleRuleChange(rule, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">{rule.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Accuracy Threshold
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          max="1"
          value={accuracyThreshold}
          onChange={(e) => setAccuracyThreshold(parseFloat(e.target.value) || 0.8)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <SelectInput
        label="On Failure Action"
        value={onFailureAction}
        options={actionOptions}
        onChange={setOnFailureAction}
      />

      <CheckboxInput
        label="Generate Validation Report"
        checked={generateReport}
        onChange={setGenerateReport}
      />

      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <strong>Node ID:</strong> {node.id}
      </div>
    </div>
  );
};

export default ModelValidatorConfigurator;