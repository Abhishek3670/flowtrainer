// frontend/src/components/PropertiesPanel/NodeConfigurators/AugmentationConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Zap } from 'lucide-react';
import TextInput from '../../../Shared/TextInput';
import CheckboxInput from '../../../Shared/CheckboxInput';
import NumberInput from '../../../Shared/NumberInput';

interface ConfiguratorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, newData: any) => void;
}

const AugmentationConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [augmentationRatio, setAugmentationRatio] = useState(node.data.parameters?.augmentationRatio || 2.0);
  const [enableRotation, setEnableRotation] = useState(node.data.parameters?.enableRotation || true);
  const [rotationRange, setRotationRange] = useState(node.data.parameters?.rotationRange || 15);
  const [enableFlip, setEnableFlip] = useState(node.data.parameters?.enableFlip || true);
  const [enableZoom, setEnableZoom] = useState(node.data.parameters?.enableZoom || true);
  const [zoomRange, setZoomRange] = useState(node.data.parameters?.zoomRange || 0.2);
  const [enableBrightness, setEnableBrightness] = useState(node.data.parameters?.enableBrightness || true);
  const [brightnessRange, setBrightnessRange] = useState(node.data.parameters?.brightnessRange || 0.3);
  const [enableNoise, setEnableNoise] = useState(node.data.parameters?.enableNoise || false);
  const [noiseLevel, setNoiseLevel] = useState(node.data.parameters?.noiseLevel || 0.1);
  const [enableCrop, setEnableCrop] = useState(node.data.parameters?.enableCrop || false);
  const [cropRatio, setCropRatio] = useState(node.data.parameters?.cropRatio || 0.8);

  useEffect(() => {
    setNodeName(node.data.label || '');
    const params = node.data.parameters || {};
    setAugmentationRatio(params.augmentationRatio || 2.0);
    setEnableRotation(params.enableRotation || true);
    setRotationRange(params.rotationRange || 15);
    setEnableFlip(params.enableFlip || true);
    setEnableZoom(params.enableZoom || true);
    setZoomRange(params.zoomRange || 0.2);
    setEnableBrightness(params.enableBrightness || true);
    setBrightnessRange(params.brightnessRange || 0.3);
    setEnableNoise(params.enableNoise || false);
    setNoiseLevel(params.noiseLevel || 0.1);
    setEnableCrop(params.enableCrop || false);
    setCropRatio(params.cropRatio || 0.8);
  }, [node]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, {
        label: nodeName,
        parameters: {
          augmentationRatio,
          enableRotation,
          rotationRange: enableRotation ? rotationRange : undefined,
          enableFlip,
          enableZoom,
          zoomRange: enableZoom ? zoomRange : undefined,
          enableBrightness,
          brightnessRange: enableBrightness ? brightnessRange : undefined,
          enableNoise,
          noiseLevel: enableNoise ? noiseLevel : undefined,
          enableCrop,
          cropRatio: enableCrop ? cropRatio : undefined
        }
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, augmentationRatio, enableRotation, rotationRange, enableFlip, enableZoom, zoomRange, enableBrightness, brightnessRange, enableNoise, noiseLevel, enableCrop, cropRatio, node.id, onNodeUpdate]);

  const getActiveAugmentations = (): string[] => {
    const active = [];
    if (enableRotation) active.push('Rotation');
    if (enableFlip) active.push('Flip');
    if (enableZoom) active.push('Zoom');
    if (enableBrightness) active.push('Brightness');
    if (enableNoise) active.push('Noise');
    if (enableCrop) active.push('Crop');
    return active;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Zap className="h-5 w-5 text-yellow-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Augmentation Configuration</h3>
      </div>

      <TextInput
        label="Node Name"
        value={nodeName}
        placeholder="Enter node name"
        onChange={setNodeName}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Augmentation Ratio (multiplier)
        </label>
        <input
          type="number"
          step="0.5"
          min="1"
          max="10"
          value={augmentationRatio}
          onChange={(e) => setAugmentationRatio(parseFloat(e.target.value) || 2.0)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="space-y-3">
        <CheckboxInput
          label="Enable Rotation"
          checked={enableRotation}
          onChange={setEnableRotation}
        />

        {enableRotation && (
          <NumberInput
            label="Rotation Range (degrees)"
            value={rotationRange}
            onChange={setRotationRange}
          />
        )}

        <CheckboxInput
          label="Enable Horizontal/Vertical Flip"
          checked={enableFlip}
          onChange={setEnableFlip}
        />

        <CheckboxInput
          label="Enable Zoom"
          checked={enableZoom}
          onChange={setEnableZoom}
        />

        {enableZoom && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Zoom Range (0.1 - 1.0)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="1"
              value={zoomRange}
              onChange={(e) => setZoomRange(parseFloat(e.target.value) || 0.2)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        <CheckboxInput
          label="Enable Brightness Adjustment"
          checked={enableBrightness}
          onChange={setEnableBrightness}
        />

        {enableBrightness && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Brightness Range (0.1 - 1.0)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="1"
              value={brightnessRange}
              onChange={(e) => setBrightnessRange(parseFloat(e.target.value) || 0.3)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        <CheckboxInput
          label="Enable Noise Addition"
          checked={enableNoise}
          onChange={setEnableNoise}
        />

        {enableNoise && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Noise Level (0.05 - 0.5)
            </label>
            <input
              type="number"
              step="0.05"
              min="0.05"
              max="0.5"
              value={noiseLevel}
              onChange={(e) => setNoiseLevel(parseFloat(e.target.value) || 0.1)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        <CheckboxInput
          label="Enable Random Crop"
          checked={enableCrop}
          onChange={setEnableCrop}
        />

        {enableCrop && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Crop Ratio (0.5 - 0.9)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.5"
              max="0.9"
              value={cropRatio}
              onChange={(e) => setCropRatio(parseFloat(e.target.value) || 0.8)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
      </div>

      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded">
        <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">Augmentation Summary:</p>
        <ul className="text-sm text-yellow-800 dark:text-yellow-200 mt-1 space-y-1">
          <li>• Dataset will be {augmentationRatio}x larger</li>
          <li>• Active: {getActiveAugmentations().join(', ')}</li>
          <li>• {getActiveAugmentations().length} augmentation techniques enabled</li>
        </ul>
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <strong>Node ID:</strong> {node.id}
      </div>
    </div>
  );
};

export default AugmentationConfigurator;