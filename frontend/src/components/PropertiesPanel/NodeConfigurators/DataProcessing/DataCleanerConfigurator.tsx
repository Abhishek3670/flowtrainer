// frontend/src/components/PropertiesPanel/NodeConfigurators/DataCleanerConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Settings } from 'lucide-react';
import TextInput from '../../../Shared/TextInput';
import SelectInput from '../../../Shared/SelectInput';
import CheckboxInput from '../../../Shared/CheckboxInput';

interface ConfiguratorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, newData: any) => void;
}

const DataCleanerConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [cleaningRules, setCleaningRules] = useState<string[]>(node.data.parameters?.cleaningRules || ['remove_duplicates', 'handle_missing']);
  const [duplicateStrategy, setDuplicateStrategy] = useState(node.data.parameters?.duplicateStrategy || 'drop');
  const [missingStrategy, setMissingStrategy] = useState(node.data.parameters?.missingStrategy || 'auto');
  const [outlierThreshold, setOutlierThreshold] = useState(node.data.parameters?.outlierThreshold || 3.0);
  const [textCleaning, setTextCleaning] = useState(node.data.parameters?.textCleaning || false);
  const [dateFormatting, setDateFormatting] = useState(node.data.parameters?.dateFormatting || false);
  const [targetDateFormat, setTargetDateFormat] = useState(node.data.parameters?.targetDateFormat || '%Y-%m-%d');

  useEffect(() => {
    setNodeName(node.data.label || '');
    const params = node.data.parameters || {};
    setCleaningRules(params.cleaningRules || ['remove_duplicates', 'handle_missing']);
    setDuplicateStrategy(params.duplicateStrategy || 'drop');
    setMissingStrategy(params.missingStrategy || 'auto');
    setOutlierThreshold(params.outlierThreshold || 3.0);
    setTextCleaning(params.textCleaning || false);
    setDateFormatting(params.dateFormatting || false);
    setTargetDateFormat(params.targetDateFormat || '%Y-%m-%d');
  }, [node]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, {
        label: nodeName,
        parameters: {
          cleaningRules,
          duplicateStrategy,
          missingStrategy,
          outlierThreshold,
          textCleaning,
          dateFormatting,
          targetDateFormat: dateFormatting ? targetDateFormat : undefined
        }
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, cleaningRules, duplicateStrategy, missingStrategy, outlierThreshold, textCleaning, dateFormatting, targetDateFormat, node.id, onNodeUpdate]);

  const availableRules = [
    'remove_duplicates', 'handle_missing', 'remove_outliers', 
    'normalize_text', 'standardize_dates', 'fix_data_types'
  ];

  const duplicateOptions = [
    { label: 'Drop Duplicates', value: 'drop' },
    { label: 'Keep First', value: 'first' },
    { label: 'Keep Last', value: 'last' },
    { label: 'Mark as Duplicate', value: 'mark' }
  ];

  const missingOptions = [
    { label: 'Auto Strategy', value: 'auto' },
    { label: 'Drop Rows', value: 'drop' },
    { label: 'Fill Forward', value: 'ffill' },
    { label: 'Fill Backward', value: 'bfill' },
    { label: 'Fill with Mean', value: 'mean' },
    { label: 'Fill with Zero', value: 'zero' }
  ];

  const handleRuleChange = (rule: string, checked: boolean) => {
    if (checked) {
      setCleaningRules([...cleaningRules, rule]);
    } else {
      setCleaningRules(cleaningRules.filter(r => r !== rule));
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Settings className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Cleaner Configuration</h3>
      </div>

      <TextInput
        label="Node Name"
        value={nodeName}
        placeholder="Enter node name"
        onChange={setNodeName}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Cleaning Rules
        </label>
        <div className="grid grid-cols-2 gap-2 border border-gray-300 dark:border-gray-600 rounded p-2">
          {availableRules.map(rule => (
            <label key={rule} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={cleaningRules.includes(rule)}
                onChange={(e) => handleRuleChange(rule, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">{rule.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectInput
          label="Duplicate Strategy"
          value={duplicateStrategy}
          options={duplicateOptions}
          onChange={setDuplicateStrategy}
        />

        <SelectInput
          label="Missing Values Strategy"
          value={missingStrategy}
          options={missingOptions}
          onChange={setMissingStrategy}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Outlier Threshold (Standard Deviations)
        </label>
        <input
          type="number"
          step="0.1"
          min="1"
          max="5"
          value={outlierThreshold}
          onChange={(e) => setOutlierThreshold(parseFloat(e.target.value) || 3.0)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="space-y-3">
        <CheckboxInput
          label="Enable Text Cleaning"
          checked={textCleaning}
          onChange={setTextCleaning}
        />

        <CheckboxInput
          label="Enable Date Formatting"
          checked={dateFormatting}
          onChange={setDateFormatting}
        />

        {dateFormatting && (
          <TextInput
            label="Target Date Format"
            value={targetDateFormat}
            placeholder="%Y-%m-%d"
            onChange={setTargetDateFormat}
          />
        )}
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <strong>Node ID:</strong> {node.id}
      </div>
    </div>
  );
};

export default DataCleanerConfigurator;
