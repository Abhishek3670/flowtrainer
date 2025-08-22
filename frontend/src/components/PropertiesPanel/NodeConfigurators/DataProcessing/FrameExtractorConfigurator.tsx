// frontend/src/components/PropertiesPanel/NodeConfigurators/FrameExtractorConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Image } from 'lucide-react';
import TextInput from '../../../Shared/TextInput';
import SelectInput from '../../../Shared/SelectInput';
import CheckboxInput from '../../../Shared/CheckboxInput';
import NumberInput from '../../../Shared/NumberInput';

interface ConfiguratorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, newData: any) => void;
}

const FrameExtractorConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [extractionMethod, setExtractionMethod] = useState(node.data.parameters?.extractionMethod || 'interval');
  const [frameRate, setFrameRate] = useState(node.data.parameters?.frameRate || 1);
  const [intervalSeconds, setIntervalSeconds] = useState(node.data.parameters?.intervalSeconds || 1);
  const [outputFormat, setOutputFormat] = useState(node.data.parameters?.outputFormat || 'jpg');
  const [quality, setQuality] = useState(node.data.parameters?.quality || 95);
  const [resizeFrames, setResizeFrames] = useState(node.data.parameters?.resizeFrames || false);
  const [targetWidth, setTargetWidth] = useState(node.data.parameters?.targetWidth || 640);
  const [targetHeight, setTargetHeight] = useState(node.data.parameters?.targetHeight || 480);
  const [startTime, setStartTime] = useState(node.data.parameters?.startTime || 0);
  const [duration, setDuration] = useState(node.data.parameters?.duration || -1);
  const [outputPath, setOutputPath] = useState(node.data.parameters?.outputPath || './frames/');

  useEffect(() => {
    setNodeName(node.data.label || '');
    const params = node.data.parameters || {};
    setExtractionMethod(params.extractionMethod || 'interval');
    setFrameRate(params.frameRate || 1);
    setIntervalSeconds(params.intervalSeconds || 1);
    setOutputFormat(params.outputFormat || 'jpg');
    setQuality(params.quality || 95);
    setResizeFrames(params.resizeFrames || false);
    setTargetWidth(params.targetWidth || 640);
    setTargetHeight(params.targetHeight || 480);
    setStartTime(params.startTime || 0);
    setDuration(params.duration || -1);
    setOutputPath(params.outputPath || './frames/');
  }, [node]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, {
        label: nodeName,
        parameters: {
          extractionMethod,
          frameRate: extractionMethod === 'fps' ? frameRate : undefined,
          intervalSeconds: extractionMethod === 'interval' ? intervalSeconds : undefined,
          outputFormat,
          quality,
          resizeFrames,
          targetWidth: resizeFrames ? targetWidth : undefined,
          targetHeight: resizeFrames ? targetHeight : undefined,
          startTime,
          duration: duration > 0 ? duration : undefined,
          outputPath
        }
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, extractionMethod, frameRate, intervalSeconds, outputFormat, quality, resizeFrames, targetWidth, targetHeight, startTime, duration, outputPath, node.id, onNodeUpdate]);

  const methodOptions = [
    { label: 'Fixed Interval', value: 'interval' },
    { label: 'Frames Per Second', value: 'fps' },
    { label: 'Key Frames Only', value: 'keyframes' },
    { label: 'Scene Changes', value: 'scenes' }
  ];

  const formatOptions = [
    { label: 'JPEG', value: 'jpg' },
    { label: 'PNG', value: 'png' },
    { label: 'BMP', value: 'bmp' },
    { label: 'TIFF', value: 'tiff' }
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Image className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Frame Extractor Configuration</h3>
      </div>

      <TextInput
        label="Node Name"
        value={nodeName}
        placeholder="Enter node name"
        onChange={setNodeName}
      />

      <SelectInput
        label="Extraction Method"
        value={extractionMethod}
        options={methodOptions}
        onChange={setExtractionMethod}
      />

      {extractionMethod === 'fps' && (
        <NumberInput
          label="Target Frame Rate"
          value={frameRate}
          onChange={setFrameRate}
        />
      )}

      {extractionMethod === 'interval' && (
        <NumberInput
          label="Interval (seconds)"
          value={intervalSeconds}
          onChange={setIntervalSeconds}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <SelectInput
          label="Output Format"
          value={outputFormat}
          options={formatOptions}
          onChange={setOutputFormat}
        />

        <NumberInput
          label="Quality (1-100)"
          value={quality}
          onChange={setQuality}
        />
      </div>

      <div className="space-y-3">
        <CheckboxInput
          label="Resize Frames"
          checked={resizeFrames}
          onChange={setResizeFrames}
        />

        {resizeFrames && (
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="Target Width"
              value={targetWidth}
              onChange={setTargetWidth}
            />

            <NumberInput
              label="Target Height"
              value={targetHeight}
              onChange={setTargetHeight}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumberInput
          label="Start Time (seconds)"
          value={startTime}
          onChange={setStartTime}
        />

        <NumberInput
          label="Duration (seconds, -1 for all)"
          value={duration}
          onChange={setDuration}
        />
      </div>

      <TextInput
        label="Output Directory"
        value={outputPath}
        placeholder="./frames/"
        onChange={setOutputPath}
      />

      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <strong>Node ID:</strong> {node.id}
      </div>
    </div>
  );
};

export default FrameExtractorConfigurator;