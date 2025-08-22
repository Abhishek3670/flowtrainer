// frontend/src/components/PropertiesPanel/NodeConfigurators/SVMClassifierConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Target } from 'lucide-react';
import TextInput from '../../../Shared/TextInput';
import NumberInput from '../../../Shared/NumberInput';
import SelectInput from '../../../Shared/SelectInput';
import CheckboxInput from '../../../Shared/CheckboxInput';

interface ConfiguratorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, newData: any) => void;
}

const SVMClassifierConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [kernel, setKernel] = useState(node.data.parameters?.kernel || 'rbf');
  const [C, setC] = useState(node.data.parameters?.C || 1.0);
  const [gamma, setGamma] = useState(node.data.parameters?.gamma || 'scale');
  const [degree, setDegree] = useState(node.data.parameters?.degree || 3);
  const [probability, setProbability] = useState(node.data.parameters?.probability || false);
  const [randomState, setRandomState] = useState(node.data.parameters?.randomState || 42);
  const [maxIter, setMaxIter] = useState(node.data.parameters?.maxIter || -1);

  // Sync with node data on node change
  useEffect(() => {
    setNodeName(node.data.label || '');
    const params = node.data.parameters || {};
    setKernel(params.kernel || 'rbf');
    setC(params.C || 1.0);
    setGamma(params.gamma || 'scale');
    setDegree(params.degree || 3);
    setProbability(params.probability || false);
    setRandomState(params.randomState || 42);
    setMaxIter(params.maxIter || -1);
  }, [node]);

  // Update node with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, {
        label: nodeName,
        parameters: {
          kernel,
          C,
          gamma,
          degree,
          probability,
          randomState,
          maxIter
        }
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, kernel, C, gamma, degree, probability, randomState, maxIter, node.id, onNodeUpdate]);

  const kernelOptions = [
    { label: 'RBF (Gaussian)', value: 'rbf' },
    { label: 'Linear', value: 'linear' },
    { label: 'Polynomial', value: 'poly' },
    { label: 'Sigmoid', value: 'sigmoid' }
  ];

  const gammaOptions = [
    { label: 'Scale', value: 'scale' },
    { label: 'Auto', value: 'auto' }
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Target className="h-5 w-5 text-red-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">SVM Classifier Configuration</h3>
      </div>

      <TextInput
        label="Node Name"
        value={nodeName}
        placeholder="Enter node name"
        onChange={setNodeName}
      />

      <SelectInput
        label="Kernel"
        value={kernel}
        options={kernelOptions}
        onChange={setKernel}
      />

      <div className="grid grid-cols-2 gap-4">
        <NumberInput
          label="Regularization (C)"
          value={C}
          onChange={setC}
        />

        {kernel === 'poly' && (
          <NumberInput
            label="Polynomial Degree"
            value={degree}
            onChange={setDegree}
          />
        )}
      </div>

      <SelectInput
        label="Gamma"
        value={gamma}
        options={gammaOptions}
        onChange={setGamma}
      />

      <div className="grid grid-cols-2 gap-4">
        <NumberInput
          label="Random State"
          value={randomState}
          onChange={setRandomState}
        />

        <NumberInput
          label="Max Iterations"
          value={maxIter}
          onChange={setMaxIter}
        />
      </div>

      <CheckboxInput
        label="Enable Probability Estimates"
        checked={probability}
        onChange={setProbability}
      />

      {kernel === 'rbf' && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>RBF Kernel:</strong> Good for non-linear problems. Adjust C and gamma for best performance.
          </p>
        </div>
      )}

      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <strong>Node ID:</strong> {node.id}
      </div>
    </div>
  );
};

export default SVMClassifierConfigurator;
