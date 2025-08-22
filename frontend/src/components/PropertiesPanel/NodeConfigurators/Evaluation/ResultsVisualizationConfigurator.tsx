// frontend/src/components/PropertiesPanel/NodeConfigurators/ResultsVisualizationConfigurator.tsx

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

const ResultsVisualizationConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [chartTypes, setChartTypes] = useState<string[]>(node.data.parameters?.chartTypes || ['bar', 'line']);
  const [metricsToVisualize, setMetricsToVisualize] = useState<string[]>(node.data.parameters?.metricsToVisualize || ['accuracy', 'loss']);
  const [colorScheme, setColorScheme] = useState(node.data.parameters?.colorScheme || 'default');
  const [figureSize, setFigureSize] = useState(node.data.parameters?.figureSize || '10x6');
  const [saveCharts, setSaveCharts] = useState(node.data.parameters?.saveCharts ?? true);
  const [outputFormat, setOutputFormat] = useState(node.data.parameters?.outputFormat || 'png');
  const [showGrid, setShowGrid] = useState(node.data.parameters?.showGrid ?? true);
  const [showLegend, setShowLegend] = useState(node.data.parameters?.showLegend ?? true);
  const [interactive, setInteractive] = useState(node.data.parameters?.interactive || false);

  useEffect(() => {
    setNodeName(node.data.label || '');
    const params = node.data.parameters || {};
    setChartTypes(params.chartTypes || ['bar', 'line']);
    setMetricsToVisualize(params.metricsToVisualize || ['accuracy', 'loss']);
    setColorScheme(params.colorScheme || 'default');
    setFigureSize(params.figureSize || '10x6');
    setSaveCharts(params.saveCharts ?? true);
    setOutputFormat(params.outputFormat || 'png');
    setShowGrid(params.showGrid ?? true);
    setShowLegend(params.showLegend ?? true);
    setInteractive(params.interactive || false);
  }, [node]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, {
        label: nodeName,
        parameters: {
          chartTypes,
          metricsToVisualize,
          colorScheme,
          figureSize,
          saveCharts,
          outputFormat: saveCharts ? outputFormat : undefined,
          showGrid,
          showLegend,
          interactive
        }
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, chartTypes, metricsToVisualize, colorScheme, figureSize, saveCharts, outputFormat, showGrid, showLegend, interactive, node.id, onNodeUpdate]);

  const availableChartTypes = ['bar', 'line', 'scatter', 'pie', 'heatmap', 'box', 'violin'];
  const availableMetrics = ['accuracy', 'precision', 'recall', 'f1_score', 'loss', 'val_loss', 'auc', 'mse', 'mae'];

  const colorSchemeOptions = [
    { label: 'Default', value: 'default' },
    { label: 'Viridis', value: 'viridis' },
    { label: 'Plasma', value: 'plasma' },
    { label: 'Blues', value: 'Blues' },
    { label: 'Reds', value: 'Reds' },
    { label: 'Set1', value: 'Set1' }
  ];

  const formatOptions = [
    { label: 'PNG', value: 'png' },
    { label: 'PDF', value: 'pdf' },
    { label: 'SVG', value: 'svg' },
    { label: 'HTML', value: 'html' }
  ];

  const sizeOptions = [
    { label: '8x6', value: '8x6' },
    { label: '10x6', value: '10x6' },
    { label: '12x8', value: '12x8' },
    { label: '16x10', value: '16x10' }
  ];

  const handleChartTypeChange = (chartType: string, checked: boolean) => {
    if (checked) {
      setChartTypes([...chartTypes, chartType]);
    } else {
      setChartTypes(chartTypes.filter(t => t !== chartType));
    }
  };

  const handleMetricChange = (metric: string, checked: boolean) => {
    if (checked) {
      setMetricsToVisualize([...metricsToVisualize, metric]);
    } else {
      setMetricsToVisualize(metricsToVisualize.filter(m => m !== metric));
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <BarChart3 className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Results Visualization Configuration</h3>
      </div>

      <TextInput
        label="Node Name"
        value={nodeName}
        placeholder="Enter node name"
        onChange={setNodeName}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Chart Types
        </label>
        <div className="grid grid-cols-3 gap-2 border border-gray-300 dark:border-gray-600 rounded p-2">
          {availableChartTypes.map(type => (
            <label key={type} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={chartTypes.includes(type)}
                onChange={(e) => handleChartTypeChange(type, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-gray-700 dark:text-gray-300 capitalize">{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Metrics to Visualize
        </label>
        <div className="grid grid-cols-3 gap-2 border border-gray-300 dark:border-gray-600 rounded p-2 max-h-32 overflow-y-auto">
          {availableMetrics.map(metric => (
            <label key={metric} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={metricsToVisualize.includes(metric)}
                onChange={(e) => handleMetricChange(metric, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">{metric.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectInput
          label="Color Scheme"
          value={colorScheme}
          options={colorSchemeOptions}
          onChange={setColorScheme}
        />

        <SelectInput
          label="Figure Size"
          value={figureSize}
          options={sizeOptions}
          onChange={setFigureSize}
        />
      </div>

      <div className="space-y-3">
        <CheckboxInput
          label="Save Charts to File"
          checked={saveCharts}
          onChange={setSaveCharts}
        />

        {saveCharts && (
          <SelectInput
            label="Output Format"
            value={outputFormat}
            options={formatOptions}
            onChange={setOutputFormat}
          />
        )}

        <CheckboxInput
          label="Show Grid"
          checked={showGrid}
          onChange={setShowGrid}
        />

        <CheckboxInput
          label="Show Legend"
          checked={showLegend}
          onChange={setShowLegend}
        />

        <CheckboxInput
          label="Interactive Charts"
          checked={interactive}
          onChange={setInteractive}
        />
      </div>

      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded">
        <p className="text-sm text-purple-800 dark:text-purple-200 font-medium">Visualization Summary:</p>
        <ul className="text-sm text-purple-800 dark:text-purple-200 mt-1 space-y-1">
          <li>• Charts: {chartTypes.join(', ')}</li>
          <li>• Metrics: {metricsToVisualize.join(', ')}</li>
          <li>• Format: {outputFormat.toUpperCase()} ({figureSize})</li>
          <li>• Interactive: {interactive ? 'Yes' : 'No'}</li>
        </ul>
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <strong>Node ID:</strong> {node.id}
      </div>
    </div>
  );
};

export default ResultsVisualizationConfigurator;