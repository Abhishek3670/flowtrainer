// frontend/src/components/PropertiesPanel/NodeConfigurators/PerformanceTriggerConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Activity } from 'lucide-react';
import TextInput from '../../../Shared/TextInput';
import SelectInput from '../../../Shared/SelectInput';
import CheckboxInput from '../../../Shared/CheckboxInput';

interface ConfiguratorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, newData: any) => void;
}

const PerformanceTriggerConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [triggerMetric, setTriggerMetric] = useState(node.data.parameters?.triggerMetric || 'accuracy');
  const [thresholdValue, setThresholdValue] = useState(node.data.parameters?.thresholdValue || 0.8);
  const [triggerCondition, setTriggerCondition] = useState(node.data.parameters?.triggerCondition || 'below');
  const [triggerAction, setTriggerAction] = useState(node.data.parameters?.triggerAction || 'retrain');
  const [enabled, setEnabled] = useState(node.data.parameters?.enabled ?? true);

  useEffect(() => {
    setNodeName(node.data.label || '');
    const params = node.data.parameters || {};
    setTriggerMetric(params.triggerMetric || 'accuracy');
    setThresholdValue(params.thresholdValue || 0.8);
    setTriggerCondition(params.triggerCondition || 'below');
    setTriggerAction(params.triggerAction || 'retrain');
    setEnabled(params.enabled ?? true);
  }, [node]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, {
        label: nodeName,
        parameters: {
          triggerMetric,
          thresholdValue,
          triggerCondition,
          triggerAction,
          enabled
        }
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, triggerMetric, thresholdValue, triggerCondition, triggerAction, enabled, node.id, onNodeUpdate]);

  const metricOptions = [
    { label: 'Accuracy', value: 'accuracy' },
    { label: 'F1 Score', value: 'f1_score' },
    { label: 'Precision', value: 'precision' },
    { label: 'Recall', value: 'recall' }
  ];

  const conditionOptions = [
    { label: 'Below Threshold', value: 'below' },
    { label: 'Above Threshold', value: 'above' }
  ];

  const actionOptions = [
    { label: 'Retrain Model', value: 'retrain' },
    { label: 'Send Alert', value: 'alert' },
    { label: 'Stop Predictions', value: 'stop' }
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Activity className="h-5 w-5 text-red-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Trigger Configuration</h3>
      </div>

      <TextInput
        label="Node Name"
        value={nodeName}
        placeholder="Enter node name"
        onChange={setNodeName}
      />

      <SelectInput
        label="Trigger Metric"
        value={triggerMetric}
        options={metricOptions}
        onChange={setTriggerMetric}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Threshold Value
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          max="1"
          value={thresholdValue}
          onChange={(e) => setThresholdValue(parseFloat(e.target.value) || 0.8)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <SelectInput
        label="Trigger Condition"
        value={triggerCondition}
        options={conditionOptions}
        onChange={setTriggerCondition}
      />

      <SelectInput
        label="Trigger Action"
        value={triggerAction}
        options={actionOptions}
        onChange={setTriggerAction}
      />

      <CheckboxInput
        label="Trigger Enabled"
        checked={enabled}
        onChange={setEnabled}
      />

      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <strong>Node ID:</strong> {node.id}
      </div>
    </div>
  );
};

export default PerformanceTriggerConfigurator;
