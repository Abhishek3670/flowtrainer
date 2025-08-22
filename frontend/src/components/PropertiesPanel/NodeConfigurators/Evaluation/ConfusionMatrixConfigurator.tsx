// frontend/src/components/PropertiesPanel/NodeConfigurators/ConfusionMatrixConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { BarChart3 } from 'lucide-react';
import TextInput from '../../../Shared/TextInput';
import SelectInput from '../../../Shared/SelectInput';
import CheckboxInput from '../../../Shared/CheckboxInput';

interface ConfiguratorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, newData: any) => void;
}

const ConfusionMatrixConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [normalize, setNormalize] = useState(node.data.parameters?.normalize || 'none');
  const [displayLabels, setDisplayLabels] = useState(node.data.parameters?.displayLabels ?? true);
  const [showValues, setShowValues] = useState(node.data.parameters?.showValues ?? true);
  const [colormap, setColormap] = useState(node.data.parameters?.colormap || 'Blues');
  const [includeStats, setIncludeStats] = useState(node.data.parameters?.includeStats ?? true);
  const [saveMatrix, setSaveMatrix] = useState(node.data.parameters?.saveMatrix ?? true);
  const [outputFormat, setOutputFormat] = useState(node.data.parameters?.outputFormat || 'png');
  const [figureSize, setFigureSize] = useState(node.data.parameters?.figureSize || '8x6');
  const [classLabels, setClassLabels] = useState(node.data.parameters?.classLabels || '');

  useEffect(() => {
    setNodeName(node.data.label || '');
    const params = node.data.parameters || {};
    setNormalize(params.normalize || 'none');
    setDisplayLabels(params.displayLabels ?? true);
    setShowValues(params.showValues ?? true);
    setColormap(params.colormap || 'Blues');
    setIncludeStats(params.includeStats ?? true);
    setSaveMatrix(params.saveMatrix ?? true);
    setOutputFormat(params.outputFormat || 'png');
    setFigureSize(params.figureSize || '8x6');
    setClassLabels(params.classLabels || '');
  }, [node]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, {
        label: nodeName,
        parameters: {
          normalize,
          displayLabels,
          showValues,
          colormap,
          includeStats,
          saveMatrix,
          outputFormat: saveMatrix ? outputFormat : undefined,
          figureSize,
          classLabels: classLabels.trim() || undefined
        }
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, normalize, displayLabels, showValues, colormap, includeStats, saveMatrix, outputFormat, figureSize, classLabels, node.id, onNodeUpdate]);

  const normalizeOptions = [
    { label: 'None', value: 'none' },
    { label: 'True (by actual class)', value: 'true' },
    { label: 'Pred (by predicted class)', value: 'pred' },
    { label: 'All (by total)', value: 'all' }
  ];

  const colormapOptions = [
    { label: 'Blues', value: 'Blues' },
    { label: 'Greens', value: 'Greens' },
    { label: 'Oranges', value: 'Oranges' },
    { label: 'Reds', value: 'Reds' },
    { label: 'Viridis', value: 'viridis' },
    { label: 'Plasma', value: 'plasma' },
    { label: 'Coolwarm', value: 'coolwarm' }
  ];

  const formatOptions = [
    { label: 'PNG', value: 'png' },
    { label: 'PDF', value: 'pdf' },
    { label: 'SVG', value: 'svg' },
    { label: 'JPG', value: 'jpg' }
  ];

  const sizeOptions = [
    { label: '6x4', value: '6x4' },
    { label: '8x6', value: '8x6' },
    { label: '10x8', value: '10x8' },
    { label: '12x10', value: '12x10' }
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <BarChart3 className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confusion Matrix Configuration</h3>
      </div>

      <TextInput
        label="Node Name"
        value={nodeName}
        placeholder="Enter node name"
        onChange={setNodeName}
      />

      <div className="grid grid-cols-2 gap-4">
        <SelectInput
          label="Normalization"
          value={normalize}
          options={normalizeOptions}
          onChange={setNormalize}
        />

        <SelectInput
          label="Color Scheme"
          value={colormap}
          options={colormapOptions}
          onChange={setColormap}
        />
      </div>

      <TextInput
        label="Custom Class Labels (comma-separated)"
        value={classLabels}
        placeholder="Class A, Class B, Class C"
        onChange={setClassLabels}
      />

      <div className="space-y-3">
        <CheckboxInput
          label="Display Class Labels"
          checked={displayLabels}
          onChange={setDisplayLabels}
        />

        <CheckboxInput
          label="Show Values in Matrix"
          checked={showValues}
          onChange={setShowValues}
        />

        <CheckboxInput
          label="Include Classification Statistics"
          checked={includeStats}
          onChange={setIncludeStats}
        />

        <CheckboxInput
          label="Save Matrix Plot"
          checked={saveMatrix}
          onChange={setSaveMatrix}
        />
      </div>

      {saveMatrix && (
        <div className="grid grid-cols-2 gap-4">
          <SelectInput
            label="Output Format"
            value={outputFormat}
            options={formatOptions}
            onChange={setOutputFormat}
          />

          <SelectInput
            label="Figure Size (inches)"
            value={figureSize}
            options={sizeOptions}
            onChange={setFigureSize}
          />
        </div>
      )}

      <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded">
        <p className="text-sm text-orange-800 dark:text-orange-200 font-medium">Matrix Configuration:</p>
        <ul className="text-sm text-orange-800 dark:text-orange-200 mt-1 space-y-1">
          <li>• Normalization: {normalizeOptions.find(n => n.value === normalize)?.label}</li>
          <li>• Color Scheme: {colormap}</li>
          {includeStats && <li>• Includes precision, recall, F1-score</li>}
          {saveMatrix && <li>• Output: {outputFormat.toUpperCase()} ({figureSize} inches)</li>}
        </ul>
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <strong>Node ID:</strong> {node.id}
      </div>
    </div>
  );
};

export default ConfusionMatrixConfigurator;
