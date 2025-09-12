// frontend/src/components/PropertiesPanel/NodeConfigurators/DataSplitConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { GitBranch } from 'lucide-react';
import TextInput from '../../../Shared/TextInput';
import NumberInput from '../../../Shared/NumberInput';
import CheckboxInput from '../../../Shared/CheckboxInput';

interface ConfiguratorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, newData: any) => void;
}

const DataSplitConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [testSize, setTestSize] = useState(node.data.parameters?.testSize || 0.2);
  const [trainSize, setTrainSize] = useState(node.data.parameters?.trainSize || null);
  const [randomState, setRandomState] = useState(node.data.parameters?.randomState || 42);
  const [shuffle, setShuffle] = useState(node.data.parameters?.shuffle ?? true);
  const [stratify, setStratify] = useState(node.data.parameters?.stratify || false);
  const [stratifyColumn, setStratifyColumn] = useState(node.data.parameters?.stratifyColumn || '');

  // Sync with node data on node change
  useEffect(() => {
    setNodeName(node.data.label || '');
    const params = node.data.parameters || {};
    setTestSize(params.testSize || 0.2);
    setTrainSize(params.trainSize || null);
    setRandomState(params.randomState || 42);
    setShuffle(params.shuffle ?? true);
    setStratify(params.stratify || false);
    setStratifyColumn(params.stratifyColumn || '');
  }, [node]);

  // Update node with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, {
        label: nodeName,
        parameters: {
          testSize,
          trainSize,
          randomState,
          shuffle,
          stratify,
          stratifyColumn: stratify ? stratifyColumn : undefined
        }
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, testSize, trainSize, randomState, shuffle, stratify, stratifyColumn, node.id, onNodeUpdate]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <GitBranch className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Train-Test Split Configuration</h3>
      </div>

      <TextInput
        label="Node Name"
        value={nodeName}
        placeholder="Enter node name"
        onChange={setNodeName}
      />

      <div className="grid grid-cols-2 gap-4">
        <NumberInput
          label="Test Size"
          value={testSize}
          onChange={setTestSize}
        />

        <NumberInput
          label="Train Size (Optional)"
          value={trainSize || ''}
          onChange={(value) => setTrainSize(value || null)}
        />
      </div>

      <NumberInput
        label="Random State"
        value={randomState}
        onChange={setRandomState}
      />

      <div className="space-y-3">
        <CheckboxInput
          label="Shuffle Data Before Split"
          checked={shuffle}
          onChange={setShuffle}
        />

        <CheckboxInput
          label="Stratified Split"
          checked={stratify}
          onChange={setStratify}
        />

        {stratify && (
          <TextInput
            label="Stratify Column"
            value={stratifyColumn}
            placeholder="Enter target column name"
            onChange={setStratifyColumn}
          />
        )}
      </div>

      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded">
        <p className="text-sm text-green-800 dark:text-green-200">
          <strong>Split Ratio:</strong> {Math.round((1 - testSize) * 100)}% Training / {Math.round(testSize * 100)}% Testing
        </p>
        {stratify && (
          <p className="text-sm text-green-800 dark:text-green-200 mt-1">
            <strong>Stratified:</strong> Maintains class distribution in both splits
          </p>
        )}
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <strong>Node ID:</strong> {node.id}
      </div>
    </div>
  );
};

export default DataSplitConfigurator;
