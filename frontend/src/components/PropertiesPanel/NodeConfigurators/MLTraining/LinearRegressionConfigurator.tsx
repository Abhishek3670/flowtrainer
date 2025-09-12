// frontend/src/components/PropertiesPanel/NodeConfigurators/LinearRegressionConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { BarChart3 } from 'lucide-react';
import TextInput from '../../../Shared/TextInput';
import CheckboxInput from '../../../Shared/CheckboxInput';
// import SelectInput from '../../../Shared/SelectInput';
import NumberInput from '../../../Shared/NumberInput';

interface ConfiguratorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, newData: any) => void;
}

const LinearRegressionConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [fitIntercept, setFitIntercept] = useState(node.data.parameters?.fitIntercept ?? true);
  const [normalize, setNormalize] = useState(node.data.parameters?.normalize || false);
  const [copyX, setCopyX] = useState(node.data.parameters?.copyX ?? true);
  const [nJobs, setNJobs] = useState(node.data.parameters?.nJobs || 1);
  const [positiveConstraint, setPositiveConstraint] = useState(node.data.parameters?.positiveConstraint || false);

  // Sync with node data on node change
  useEffect(() => {
    setNodeName(node.data.label || '');
    const params = node.data.parameters || {};
    setFitIntercept(params.fitIntercept ?? true);
    setNormalize(params.normalize || false);
    setCopyX(params.copyX ?? true);
    setNJobs(params.nJobs || 1);
    setPositiveConstraint(params.positiveConstraint || false);
  }, [node]);

  // Update node with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, {
        label: nodeName,
        parameters: {
          fitIntercept,
          normalize,
          copyX,
          nJobs,
          positiveConstraint
        }
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, fitIntercept, normalize, copyX, nJobs, positiveConstraint, node.id, onNodeUpdate]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <BarChart3 className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Linear Regression Configuration</h3>
      </div>

      <TextInput
        label="Node Name"
        value={nodeName}
        placeholder="Enter node name"
        onChange={setNodeName}
      />

      <div className="space-y-3">
        <CheckboxInput
          label="Fit Intercept"
          checked={fitIntercept}
          onChange={setFitIntercept}
        />

        <CheckboxInput
          label="Normalize Features"
          checked={normalize}
          onChange={setNormalize}
        />

        <CheckboxInput
          label="Copy Input Data"
          checked={copyX}
          onChange={setCopyX}
        />

        <CheckboxInput
          label="Force Positive Coefficients"
          checked={positiveConstraint}
          onChange={setPositiveConstraint}
        />
      </div>

      <NumberInput
        label="Number of Jobs"
        value={nJobs}
        onChange={setNJobs}
      />

      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Tip:</strong> Set jobs to -1 to use all available processors for faster computation.
        </p>
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <strong>Node ID:</strong> {node.id}
      </div>
    </div>
  );
};

export default LinearRegressionConfigurator;
