// frontend/src/components/PropertiesPanel/NodeConfigurators/HyperparameterConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Settings } from 'lucide-react';
import TextInput from '../../../Shared/TextInput';
import SelectInput from '../../../Shared/SelectInput';
import CheckboxInput from '../../../Shared/CheckboxInput';
import NumberInput from '../../../Shared/NumberInput';

interface ConfiguratorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, newData: any) => void;
}

const HyperparameterConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [searchMethod, setSearchMethod] = useState(node.data.parameters?.searchMethod || 'grid_search');
  const [crossValidationFolds, setCrossValidationFolds] = useState(node.data.parameters?.crossValidationFolds || 5);
  const [scoring, setScoring] = useState(node.data.parameters?.scoring || 'accuracy');
  const [nIterations, setNIterations] = useState(node.data.parameters?.nIterations || 100);
  const [randomState, setRandomState] = useState(node.data.parameters?.randomState || 42);
  const [nJobs, setNJobs] = useState(node.data.parameters?.nJobs || -1);
  const [verbose, setVerbose] = useState(node.data.parameters?.verbose || true);
  const [returnTrainScore, setReturnTrainScore] = useState(node.data.parameters?.returnTrainScore || false);
  const [refit, setRefit] = useState(node.data.parameters?.refit || true);
  const [parameterGrid, setParameterGrid] = useState(node.data.parameters?.parameterGrid || '');
  const [optimizationObjective, setOptimizationObjective] = useState(node.data.parameters?.optimizationObjective || 'maximize');

  // Sync with node data on node change
  useEffect(() => {
    setNodeName(node.data.label || '');
    const params = node.data.parameters || {};
    setSearchMethod(params.searchMethod || 'grid_search');
    setCrossValidationFolds(params.crossValidationFolds || 5);
    setScoring(params.scoring || 'accuracy');
    setNIterations(params.nIterations || 100);
    setRandomState(params.randomState || 42);
    setNJobs(params.nJobs || -1);
    setVerbose(params.verbose || true);
    setReturnTrainScore(params.returnTrainScore || false);
    setRefit(params.refit || true);
    setParameterGrid(params.parameterGrid || '');
    setOptimizationObjective(params.optimizationObjective || 'maximize');
  }, [node]);

  // Update node with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, {
        label: nodeName,
        parameters: {
          searchMethod,
          crossValidationFolds,
          scoring,
          nIterations: searchMethod === 'random_search' || searchMethod === 'bayesian' ? nIterations : undefined,
          randomState,
          nJobs,
          verbose,
          returnTrainScore,
          refit,
          parameterGrid: parameterGrid.trim() || undefined,
          optimizationObjective
        }
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, searchMethod, crossValidationFolds, scoring, nIterations, randomState, nJobs, verbose, returnTrainScore, refit, parameterGrid, optimizationObjective, node.id, onNodeUpdate]);

  const searchMethodOptions = [
    { label: 'Grid Search', value: 'grid_search' },
    { label: 'Random Search', value: 'random_search' },
    { label: 'Bayesian Optimization', value: 'bayesian' },
    { label: 'Halving Grid Search', value: 'halving_grid' },
    { label: 'Halving Random Search', value: 'halving_random' }
  ];

  const scoringOptions = [
    { label: 'Accuracy', value: 'accuracy' },
    { label: 'F1 Score', value: 'f1' },
    { label: 'F1 Weighted', value: 'f1_weighted' },
    { label: 'Precision', value: 'precision' },
    { label: 'Recall', value: 'recall' },
    { label: 'ROC AUC', value: 'roc_auc' },
    { label: 'R² Score', value: 'r2' },
    { label: 'Mean Squared Error', value: 'neg_mean_squared_error' },
    { label: 'Mean Absolute Error', value: 'neg_mean_absolute_error' }
  ];

  const objectiveOptions = [
    { label: 'Maximize', value: 'maximize' },
    { label: 'Minimize', value: 'minimize' }
  ];

  const getDefaultParameterGrid = (): string => {
    return `{
  "n_estimators": [50, 100, 200],
  "max_depth": [3, 5, 10, None],
  "min_samples_split": [2, 5, 10],
  "min_samples_leaf": [1, 2, 4]
}`;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Settings className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hyperparameter Tuning Configuration</h3>
      </div>

      <TextInput
        label="Node Name"
        value={nodeName}
        placeholder="Enter node name"
        onChange={setNodeName}
      />

      <SelectInput
        label="Search Method"
        value={searchMethod}
        options={searchMethodOptions}
        onChange={setSearchMethod}
      />

      <div className="grid grid-cols-2 gap-4">
        <NumberInput
          label="Cross Validation Folds"
          value={crossValidationFolds}
          onChange={setCrossValidationFolds}
        />

        {(searchMethod === 'random_search' || searchMethod === 'bayesian') && (
          <NumberInput
            label="Number of Iterations"
            value={nIterations}
            onChange={setNIterations}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectInput
          label="Scoring Metric"
          value={scoring}
          options={scoringOptions}
          onChange={setScoring}
        />

        <SelectInput
          label="Optimization Objective"
          value={optimizationObjective}
          options={objectiveOptions}
          onChange={setOptimizationObjective}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumberInput
          label="Random State"
          value={randomState}
          onChange={setRandomState}
        />

        <NumberInput
          label="Number of Jobs"
          value={nJobs}
          onChange={setNJobs}
        />
      </div>

      <div className="space-y-3">
        <CheckboxInput
          label="Verbose Output"
          checked={verbose}
          onChange={setVerbose}
        />

        <CheckboxInput
          label="Return Training Scores"
          checked={returnTrainScore}
          onChange={setReturnTrainScore}
        />

        <CheckboxInput
          label="Refit Best Model"
          checked={refit}
          onChange={setRefit}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Parameter Grid (JSON)
        </label>
        <textarea
          value={parameterGrid}
          onChange={(e) => setParameterGrid(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          placeholder={getDefaultParameterGrid()}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Define parameter ranges as JSON. Leave empty for default grid.
        </p>
      </div>

      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded">
        <p className="text-sm text-purple-800 dark:text-purple-200 font-medium">Search Configuration:</p>
        <ul className="text-sm text-purple-800 dark:text-purple-200 mt-1 space-y-1">
          <li>• Method: {searchMethodOptions.find(m => m.value === searchMethod)?.label}</li>
          <li>• Scoring: {scoringOptions.find(s => s.value === scoring)?.label}</li>
          <li>• CV Folds: {crossValidationFolds}</li>
          {(searchMethod === 'random_search' || searchMethod === 'bayesian') && (
            <li>• Iterations: {nIterations}</li>
          )}
        </ul>
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <strong>Node ID:</strong> {node.id}
      </div>
    </div>
  );
};

export default HyperparameterConfigurator;
