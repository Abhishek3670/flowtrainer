// frontend/src/components/PropertiesPanel/NodeConfigurators/ModelExportConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Download } from 'lucide-react';
import TextInput from '../../../../Shared/TextInput';
import SelectInput from '../../../../Shared/SelectInput';
import CheckboxInput from '../../../../Shared/CheckboxInput';

interface ConfiguratorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, newData: any) => void;
}

const ModelExportConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [exportFormat, setExportFormat] = useState(node.data.parameters?.exportFormat || 'pickle');
  const [exportPath, setExportPath] = useState(node.data.parameters?.exportPath || './models/');
  const [fileName, setFileName] = useState(node.data.parameters?.fileName || 'model');
  const [includeMetadata, setIncludeMetadata] = useState(node.data.parameters?.includeMetadata ?? true);
  const [includeScaler, setIncludeScaler] = useState(node.data.parameters?.includeScaler ?? true);
  const [includeEncoder, setIncludeEncoder] = useState(node.data.parameters?.includeEncoder ?? true);
  const [compression, setCompression] = useState(node.data.parameters?.compression ?? true);
  const [versioning, setVersioning] = useState(node.data.parameters?.versioning ?? true);
  const [documentationFormat, setDocumentationFormat] = useState(node.data.parameters?.documentationFormat || 'json');
  const [createDocumentation, setCreateDocumentation] = useState(node.data.parameters?.createDocumentation ?? true);

  // Sync with node data on node change
  useEffect(() => {
    setNodeName(node.data.label || '');
    const params = node.data.parameters || {};
    setExportFormat(params.exportFormat || 'pickle');
    setExportPath(params.exportPath || './models/');
    setFileName(params.fileName || 'model');
    setIncludeMetadata(params.includeMetadata ?? true);
    setIncludeScaler(params.includeScaler ?? true);
    setIncludeEncoder(params.includeEncoder ?? true);
    setCompression(params.compression ?? true);
    setVersioning(params.versioning ?? true);
    setDocumentationFormat(params.documentationFormat || 'json');
    setCreateDocumentation(params.createDocumentation ?? true);
  }, [node]);

  // Update node with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, {
        label: nodeName,
        parameters: {
          exportFormat,
          exportPath,
          fileName,
          includeMetadata,
          includeScaler,
          includeEncoder,
          compression,
          versioning,
          documentationFormat: createDocumentation ? documentationFormat : undefined,
          createDocumentation
        }
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, exportFormat, exportPath, fileName, includeMetadata, includeScaler, includeEncoder, compression, versioning, documentationFormat, createDocumentation, node.id, onNodeUpdate]);

  const exportFormatOptions = [
    { label: 'Pickle (.pkl)', value: 'pickle' },
    { label: 'Joblib (.joblib)', value: 'joblib' },
    { label: 'ONNX (.onnx)', value: 'onnx' },
    { label: 'TensorFlow SavedModel', value: 'tensorflow' },
    { label: 'PyTorch (.pth)', value: 'pytorch' },
    { label: 'Scikit-learn (.pkl)', value: 'sklearn' },
    { label: 'PMML (.pmml)', value: 'pmml' }
  ];

  const documentationFormatOptions = [
    { label: 'JSON', value: 'json' },
    { label: 'YAML', value: 'yaml' },
    { label: 'Markdown', value: 'markdown' },
    { label: 'HTML', value: 'html' }
  ];

  const getFileExtension = (): string => {
    const extensions: Record<string, string> = {
      'pickle': '.pkl',
      'joblib': '.joblib',
      'onnx': '.onnx',
      'tensorflow': '',
      'pytorch': '.pth',
      'sklearn': '.pkl',
      'pmml': '.pmml'
    };
    return extensions[exportFormat] || '.pkl';
  };

  const generateFullPath = (): string => {
    const timestamp = versioning ? `_${new Date().toISOString().split('T')}` : '';
    return `${exportPath}${fileName}${timestamp}${getFileExtension()}`;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Download className="h-5 w-5 text-red-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Model Export Configuration</h3>
      </div>

      <TextInput
        label="Node Name"
        value={nodeName}
        placeholder="Enter node name"
        onChange={setNodeName}
      />

      <SelectInput
        label="Export Format"
        value={exportFormat}
        options={exportFormatOptions}
        onChange={setExportFormat}
      />

      <div className="grid grid-cols-2 gap-4">
        <TextInput
          label="Export Path"
          value={exportPath}
          placeholder="./models/"
          onChange={setExportPath}
        />

        <TextInput
          label="File Name"
          value={fileName}
          placeholder="model"
          onChange={setFileName}
        />
      </div>

      <div className="space-y-3">
        <CheckboxInput
          label="Include Model Metadata"
          checked={includeMetadata}
          onChange={setIncludeMetadata}
        />

        <CheckboxInput
          label="Include Scaler/Preprocessor"
          checked={includeScaler}
          onChange={setIncludeScaler}
        />

        <CheckboxInput
          label="Include Encoder"
          checked={includeEncoder}
          onChange={setIncludeEncoder}
        />

        <CheckboxInput
          label="Enable Compression"
          checked={compression}
          onChange={setCompression}
        />

        <CheckboxInput
          label="Version Control (Add Date)"
          checked={versioning}
          onChange={setVersioning}
        />
      </div>

      <div className="space-y-3">
        <CheckboxInput
          label="Create Documentation"
          checked={createDocumentation}
          onChange={setCreateDocumentation}
        />

        {createDocumentation && (
          <SelectInput
            label="Documentation Format"
            value={documentationFormat}
            options={documentationFormatOptions}
            onChange={setDocumentationFormat}
          />
        )}
      </div>

      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded">
        <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">Export Preview:</p>
        <code className="text-xs text-red-700 dark:text-red-300 break-all">
          {generateFullPath()}
        </code>
        {createDocumentation && (
          <p className="text-xs text-red-700 dark:text-red-300 mt-1">
            + Documentation: {fileName}_docs.{documentationFormat}
          </p>
        )}
      </div>

      {exportFormat === 'onnx' && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>ONNX Format:</strong> Optimized for cross-platform deployment and inference.
          </p>
        </div>
      )}

      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <strong>Node ID:</strong> {node.id}
      </div>
    </div>
  );
};

export default ModelExportConfigurator;
