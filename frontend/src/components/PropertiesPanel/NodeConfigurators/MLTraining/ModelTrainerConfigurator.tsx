// frontend/src/components/PropertiesPanel/NodeConfigurators/ModelTrainerConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Brain } from 'lucide-react';
import TextInput from '../../../Shared/TextInput';
import SelectInput from '../../../Shared/SelectInput';
import CheckboxInput from '../../../Shared/CheckboxInput';
import NumberInput from '../../../Shared/NumberInput';

interface ConfiguratorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, newData: any) => void;
}

const ModelTrainerConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [algorithm, setAlgorithm] = useState(node.data.parameters?.algorithm || 'auto');
  const [testSize, setTestSize] = useState(node.data.parameters?.testSize || 0.2);
  const [randomState, setRandomState] = useState(node.data.parameters?.randomState || 42);
  const [crossValidation, setCrossValidation] = useState(node.data.parameters?.crossValidation || true);
  const [cvFolds, setCvFolds] = useState(node.data.parameters?.cvFolds || 5);
  const [scoringMetric, setScoringMetric] = useState(node.data.parameters?.scoringMetric || 'accuracy');
  const [saveModel, setSaveModel] = useState(node.data.parameters?.saveModel ?? true);
  const [modelPath, setModelPath] = useState(node.data.parameters?.modelPath || './models/');
  const [hyperparameterTuning, setHyperparameterTuning] = useState(node.data.parameters?.hyperparameterTuning || false);
  const [tuningMethod, setTuningMethod] = useState(node.data.parameters?.tuningMethod || 'grid_search');

  useEffect(() => {
    setNodeName(node.data.label || '');
    const params = node.data.parameters || {};
    setAlgorithm(params.algorithm || 'auto');
    setTestSize(params.testSize || 0.2);
    setRandomState(params.randomState || 42);
    setCrossValidation(params.crossValidation || true);
    setCvFolds(params.cvFolds || 5);
    setScoringMetric(params.scoringMetric || 'accuracy');
    setSaveModel(params.saveModel ?? true);
    setModelPath(params.modelPath || './models/');
    setHyperparameterTuning(params.hyperparameterTuning || false);
    setTuningMethod(params.tuningMethod || 'grid_search');
  }, [node]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, {
        label: nodeName,
        parameters: {
          algorithm,
          testSize,
          randomState,
          crossValidation,
          cvFolds: crossValidation ? cvFolds : undefined,
          scoringMetric,
          saveModel,
          modelPath: saveModel ? modelPath : undefined,
          hyperparameterTuning,
          tuningMethod: hyperparameterTuning ? tuningMethod : undefined
        }
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, algorithm, testSize, randomState, crossValidation, cvFolds, scoringMetric, saveModel, modelPath, hyperparameterTuning, tuningMethod, node.id, onNodeUpdate]);

  const algorithmOptions = [
    { label: 'Auto Select', value: 'auto' },
    { label: 'Random Forest', value: 'random_forest' },
    { label: 'Gradient Boosting', value: 'gradient_boosting' },
    { label: 'SVM', value: 'svm' },
    { label: 'Logistic Regression', value: 'logistic_regression' },
    { label: 'K-Nearest Neighbors', value: 'knn' },
    { label: 'Decision Tree', value: 'decision_tree' },
    { label: 'Naive Bayes', value: 'naive_bayes' }
  ];

  const scoringOptions = [
    { label: 'Accuracy', value: 'accuracy' },
    { label: 'F1 Score', value: 'f1' },
    { label: 'Precision', value: 'precision' },
    { label: 'Recall', value: 'recall' },
    { label: 'ROC AUC', value: 'roc_auc' },
    { label: 'R² Score', value: 'r2' }
  ];

  const tuningOptions = [
    { label: 'Grid Search', value: 'grid_search' },
    { label: 'Random Search', value: 'random_search' },
    { label: 'Bayesian Optimization', value: 'bayesian' }
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Brain className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generic Model Trainer Configuration</h3>
      </div>

      <TextInput
        label="Node Name"
        value={nodeName}
        placeholder="Enter node name"
        onChange={setNodeName}
      />

      <SelectInput
        label="Algorithm"
        value={algorithm}
        options={algorithmOptions}
        onChange={setAlgorithm}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Test Size
          </label>
          <input
            type="number"
            step="0.05"
            min="0.1"
            max="0.5"
            value={testSize}
            onChange={(e) => setTestSize(parseFloat(e.target.value) || 0.2)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <NumberInput
          label="Random State"
          value={randomState}
          onChange={setRandomState}
        />
      </div>

      <div className="space-y-3">
        <CheckboxInput
          label="Use Cross Validation"
          checked={crossValidation}
          onChange={setCrossValidation}
        />

        {crossValidation && (
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="CV Folds"
              value={cvFolds}
              onChange={setCvFolds}
            />

            <SelectInput
              label="Scoring Metric"
              value={scoringMetric}
              options={scoringOptions}
              onChange={setScoringMetric}
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <CheckboxInput
          label="Save Trained Model"
          checked={saveModel}
          onChange={setSaveModel}
        />

        {saveModel && (
          <TextInput
            label="Model Save Path"
            value={modelPath}
            placeholder="./models/"
            onChange={setModelPath}
          />
        )}
      </div>

      <div className="space-y-3">
        <CheckboxInput
          label="Enable Hyperparameter Tuning"
          checked={hyperparameterTuning}
          onChange={setHyperparameterTuning}
        />

        {hyperparameterTuning && (
          <SelectInput
            label="Tuning Method"
            value={tuningMethod}
            options={tuningOptions}
            onChange={setTuningMethod}
          />
        )}
      </div>

      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded">
        <p className="text-sm text-purple-800 dark:text-purple-200 font-medium">Training Configuration:</p>
        <ul className="text-sm text-purple-800 dark:text-purple-200 mt-1 space-y-1">
          <li>• Algorithm: {algorithmOptions.find(a => a.value === algorithm)?.label}</li>
          <li>• Test Split: {Math.round(testSize * 100)}%</li>
          {crossValidation && <li>• Cross Validation: {cvFolds} folds</li>}
          {hyperparameterTuning && <li>• Hyperparameter Tuning: {tuningOptions.find(t => t.value === tuningMethod)?.label}</li>}
        </ul>
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <strong>Node ID:</strong> {node.id}
      </div>
    </div>
  );
};

export default ModelTrainerConfigurator;
