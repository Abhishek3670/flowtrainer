// frontend/src/components/PropertiesPanel/NodeConfigurators/TransferLearningConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Cpu } from 'lucide-react';
import TextInput from '../../../Shared/TextInput';
import SelectInput from '../../../Shared/SelectInput';
import CheckboxInput from '../../../Shared/CheckboxInput';
import NumberInput from '../../../Shared/NumberInput';

interface ConfiguratorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, newData: any) => void;
}

const TransferLearningConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [baseModel, setBaseModel] = useState(node.data.parameters?.baseModel || 'resnet50');
  const [pretrainedWeights, setPretrainedWeights] = useState(node.data.parameters?.pretrainedWeights || 'imagenet');
  const [freezeLayers, setFreezeLayers] = useState(node.data.parameters?.freezeLayers || true);
  const [unfreezeFrom, setUnfreezeFrom] = useState(node.data.parameters?.unfreezeFrom || -2);
  const [learningRate, setLearningRate] = useState(node.data.parameters?.learningRate || 0.001);
  const [fineTuneLearningRate, setFineTuneLearningRate] = useState(node.data.parameters?.fineTuneLearningRate || 0.0001);
  const [batchSize, setBatchSize] = useState(node.data.parameters?.batchSize || 32);
  const [epochs, setEpochs] = useState(node.data.parameters?.epochs || 10);
  const [fineTuneEpochs, setFineTuneEpochs] = useState(node.data.parameters?.fineTuneEpochs || 5);
  const [optimizer, setOptimizer] = useState(node.data.parameters?.optimizer || 'adam');
  const [useDataAugmentation, setUseDataAugmentation] = useState(node.data.parameters?.useDataAugmentation || true);
  const [dropoutRate, setDropoutRate] = useState(node.data.parameters?.dropoutRate || 0.2);
  const [useEarlyStopping, setUseEarlyStopping] = useState(node.data.parameters?.useEarlyStopping || true);
  const [patience, setPatience] = useState(node.data.parameters?.patience || 5);

  // Sync with node data on node change
  useEffect(() => {
    setNodeName(node.data.label || '');
    const params = node.data.parameters || {};
    setBaseModel(params.baseModel || 'resnet50');
    setPretrainedWeights(params.pretrainedWeights || 'imagenet');
    setFreezeLayers(params.freezeLayers || true);
    setUnfreezeFrom(params.unfreezeFrom || -2);
    setLearningRate(params.learningRate || 0.001);
    setFineTuneLearningRate(params.fineTuneLearningRate || 0.0001);
    setBatchSize(params.batchSize || 32);
    setEpochs(params.epochs || 10);
    setFineTuneEpochs(params.fineTuneEpochs || 5);
    setOptimizer(params.optimizer || 'adam');
    setUseDataAugmentation(params.useDataAugmentation || true);
    setDropoutRate(params.dropoutRate || 0.2);
    setUseEarlyStopping(params.useEarlyStopping || true);
    setPatience(params.patience || 5);
  }, [node]);

  // Update node with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, {
        label: nodeName,
        parameters: {
          baseModel,
          pretrainedWeights,
          freezeLayers,
          unfreezeFrom: freezeLayers ? unfreezeFrom : undefined,
          learningRate,
          fineTuneLearningRate,
          batchSize,
          epochs,
          fineTuneEpochs,
          optimizer,
          useDataAugmentation,
          dropoutRate,
          useEarlyStopping,
          patience: useEarlyStopping ? patience : undefined
        }
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, baseModel, pretrainedWeights, freezeLayers, unfreezeFrom, learningRate, fineTuneLearningRate, batchSize, epochs, fineTuneEpochs, optimizer, useDataAugmentation, dropoutRate, useEarlyStopping, patience, node.id, onNodeUpdate]);

  const baseModelOptions = [
    { label: 'ResNet50', value: 'resnet50' },
    { label: 'ResNet101', value: 'resnet101' },
    { label: 'VGG16', value: 'vgg16' },
    { label: 'VGG19', value: 'vgg19' },
    { label: 'InceptionV3', value: 'inception_v3' },
    { label: 'MobileNet', value: 'mobilenet' },
    { label: 'EfficientNet-B0', value: 'efficientnet_b0' },
    { label: 'DenseNet121', value: 'densenet121' }
  ];

  const weightsOptions = [
    { label: 'ImageNet', value: 'imagenet' },
    { label: 'COCO', value: 'coco' },
    { label: 'None (Random)', value: 'none' }
  ];

  const optimizerOptions = [
    { label: 'Adam', value: 'adam' },
    { label: 'AdamW', value: 'adamw' },
    { label: 'SGD', value: 'sgd' },
    { label: 'RMSprop', value: 'rmsprop' }
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Cpu className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transfer Learning Configuration</h3>
      </div>

      <TextInput
        label="Node Name"
        value={nodeName}
        placeholder="Enter node name"
        onChange={setNodeName}
      />

      <div className="grid grid-cols-2 gap-4">
        <SelectInput
          label="Base Model"
          value={baseModel}
          options={baseModelOptions}
          onChange={setBaseModel}
        />

        <SelectInput
          label="Pretrained Weights"
          value={pretrainedWeights}
          options={weightsOptions}
          onChange={setPretrainedWeights}
        />
      </div>

      <div className="space-y-3">
        <CheckboxInput
          label="Freeze Base Layers"
          checked={freezeLayers}
          onChange={setFreezeLayers}
        />

        {freezeLayers && (
          <NumberInput
            label="Unfreeze From Layer"
            value={unfreezeFrom}
            onChange={setUnfreezeFrom}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Learning Rate
          </label>
          <input
            type="number"
            step="0.0001"
            value={learningRate}
            onChange={(e) => setLearningRate(parseFloat(e.target.value) || 0.001)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fine-tune Learning Rate
          </label>
          <input
            type="number"
            step="0.0001"
            value={fineTuneLearningRate}
            onChange={(e) => setFineTuneLearningRate(parseFloat(e.target.value) || 0.0001)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <NumberInput
          label="Batch Size"
          value={batchSize}
          onChange={setBatchSize}
        />

        <NumberInput
          label="Initial Epochs"
          value={epochs}
          onChange={setEpochs}
        />

        <NumberInput
          label="Fine-tune Epochs"
          value={fineTuneEpochs}
          onChange={setFineTuneEpochs}
        />
      </div>

      <SelectInput
        label="Optimizer"
        value={optimizer}
        options={optimizerOptions}
        onChange={setOptimizer}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Dropout Rate
        </label>
        <input
          type="number"
          step="0.1"
          min="0"
          max="1"
          value={dropoutRate}
          onChange={(e) => setDropoutRate(parseFloat(e.target.value) || 0.2)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="space-y-3">
        <CheckboxInput
          label="Use Data Augmentation"
          checked={useDataAugmentation}
          onChange={setUseDataAugmentation}
        />

        <CheckboxInput
          label="Use Early Stopping"
          checked={useEarlyStopping}
          onChange={setUseEarlyStopping}
        />

        {useEarlyStopping && (
          <NumberInput
            label="Patience (epochs)"
            value={patience}
            onChange={setPatience}
          />
        )}
      </div>

      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded">
        <p className="text-sm text-indigo-800 dark:text-indigo-200 font-medium">Training Strategy:</p>
        <ul className="text-sm text-indigo-800 dark:text-indigo-200 mt-1 space-y-1">
          <li>• Phase 1: {epochs} epochs with frozen layers (LR: {learningRate})</li>
          <li>• Phase 2: {fineTuneEpochs} epochs fine-tuning (LR: {fineTuneLearningRate})</li>
          <li>• Base Model: {baseModelOptions.find(m => m.value === baseModel)?.label}</li>
          <li>• Batch Size: {batchSize}</li>
        </ul>
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <strong>Node ID:</strong> {node.id}
      </div>
    </div>
  );
};

export default TransferLearningConfigurator;
