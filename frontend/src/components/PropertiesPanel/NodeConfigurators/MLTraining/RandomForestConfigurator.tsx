// frontend/src/components/PropertiesPanel/NodeConfigurators/RandomForestConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Brain } from 'lucide-react';
import TextInput from '../../../Shared/TextInput';
import NumberInput from '../../../Shared/NumberInput';
import CheckboxInput from '../../../Shared/CheckboxInput';
import SelectInput from '../../../Shared/SelectInput';

interface ConfiguratorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, newData: any) => void;
}

const RandomForestConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [nEstimators, setNEstimators] = useState(node.data.parameters?.nEstimators || 100);
  const [maxDepth, setMaxDepth] = useState(node.data.parameters?.maxDepth || 10);
  const [minSamplesSplit, setMinSamplesSplit] = useState(node.data.parameters?.minSamplesSplit || 2);
  const [minSamplesLeaf, setMinSamplesLeaf] = useState(node.data.parameters?.minSamplesLeaf || 1);
  const [randomState, setRandomState] = useState(node.data.parameters?.randomState || 42);
  const [bootstrap, setBootstrap] = useState(node.data.parameters?.bootstrap ?? true);
  const [criterion, setCriterion] = useState(node.data.parameters?.criterion || 'gini');
  const [maxFeatures, setMaxFeatures] = useState(node.data.parameters?.maxFeatures || 'sqrt');

  // Sync with node data on node change
  useEffect(() => {
    setNodeName(node.data.label || '');
    const params = node.data.parameters || {};
    setNEstimators(params.nEstimators || 100);
    setMaxDepth(params.maxDepth || 10);
    setMinSamplesSplit(params.minSamplesSplit || 2);
    setMinSamplesLeaf(params.minSamplesLeaf || 1);
    setRandomState(params.randomState || 42);
    setBootstrap(params.bootstrap ?? true);
    setCriterion(params.criterion || 'gini');
    setMaxFeatures(params.maxFeatures || 'sqrt');
  }, [node]);

  // Update node with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, {
        label: nodeName,
        parameters: {
          nEstimators,
          maxDepth,
          minSamplesSplit,
          minSamplesLeaf,
          randomState,
          bootstrap,
          criterion,
          maxFeatures
        }
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, nEstimators, maxDepth, minSamplesSplit, minSamplesLeaf, randomState, bootstrap, criterion, maxFeatures, node.id, onNodeUpdate]);

  const criterionOptions = [
    { label: 'Gini Impurity', value: 'gini' },
    { label: 'Entropy', value: 'entropy' }
  ];

  const maxFeaturesOptions = [
    { label: 'Square Root', value: 'sqrt' },
    { label: 'Log2', value: 'log2' },
    { label: 'All Features', value: 'auto' },
    { label: 'None (All)', value: 'none' }
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Brain className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Random Forest Configuration</h3>
      </div>

      <TextInput
        label="Node Name"
        value={nodeName}
        placeholder="Enter node name"
        onChange={setNodeName}
      />

      <div className="grid grid-cols-2 gap-4">
        <NumberInput
          label="Number of Trees"
          value={nEstimators}
          onChange={setNEstimators}
        />

        <NumberInput
          label="Max Depth"
          value={maxDepth}
          onChange={setMaxDepth}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumberInput
          label="Min Samples Split"
          value={minSamplesSplit}
          onChange={setMinSamplesSplit}
        />

        <NumberInput
          label="Min Samples Leaf"
          value={minSamplesLeaf}
          onChange={setMinSamplesLeaf}
        />
      </div>

      <SelectInput
        label="Split Criterion"
        value={criterion}
        options={criterionOptions}
        onChange={setCriterion}
      />

      <SelectInput
        label="Max Features"
        value={maxFeatures}
        options={maxFeaturesOptions}
        onChange={setMaxFeatures}
      />

      <NumberInput
        label="Random State"
        value={randomState}
        onChange={setRandomState}
      />

      <CheckboxInput
        label="Bootstrap Samples"
        checked={bootstrap}
        onChange={setBootstrap}
      />

      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <strong>Node ID:</strong> {node.id}
      </div>
    </div>
  );
};

export default RandomForestConfigurator;
