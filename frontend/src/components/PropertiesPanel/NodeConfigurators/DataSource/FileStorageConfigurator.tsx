// frontend/src/components/PropertiesPanel/NodeConfigurators/FileStorageConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { FileText } from 'lucide-react';
import TextInput from '../../../Shared/TextInput';
import SelectInput from '../../../Shared/SelectInput';
import CheckboxInput from '../../../Shared/CheckboxInput';

interface ConfiguratorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, newData: any) => void;
}

const FileStorageConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [storageProvider, setStorageProvider] = useState(node.data.parameters?.storageProvider || 'aws_s3');
  const [bucketName, setBucketName] = useState(node.data.parameters?.bucketName || '');
  const [accessKey, setAccessKey] = useState(node.data.parameters?.accessKey || '');
  const [secretKey, setSecretKey] = useState(node.data.parameters?.secretKey || '');
  const [region, setRegion] = useState(node.data.parameters?.region || 'us-east-1');
  const [folderPath, setFolderPath] = useState(node.data.parameters?.folderPath || '/');
  const [filePattern, setFilePattern] = useState(node.data.parameters?.filePattern || '*.csv');
  const [enableEncryption, setEnableEncryption] = useState(node.data.parameters?.enableEncryption || false);
  const [enableVersioning, setEnableVersioning] = useState(node.data.parameters?.enableVersioning || false);
  const [maxFileSize, setMaxFileSize] = useState(node.data.parameters?.maxFileSize || 100);

  useEffect(() => {
    setNodeName(node.data.label || '');
    const params = node.data.parameters || {};
    setStorageProvider(params.storageProvider || 'aws_s3');
    setBucketName(params.bucketName || '');
    setAccessKey(params.accessKey || '');
    setSecretKey(params.secretKey || '');
    setRegion(params.region || 'us-east-1');
    setFolderPath(params.folderPath || '/');
    setFilePattern(params.filePattern || '*.csv');
    setEnableEncryption(params.enableEncryption || false);
    setEnableVersioning(params.enableVersioning || false);
    setMaxFileSize(params.maxFileSize || 100);
  }, [node]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, {
        label: nodeName,
        parameters: {
          storageProvider,
          bucketName,
          accessKey,
          secretKey,
          region: storageProvider.includes('aws') || storageProvider.includes('gcp') ? region : undefined,
          folderPath,
          filePattern,
          enableEncryption,
          enableVersioning,
          maxFileSize
        }
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, storageProvider, bucketName, accessKey, secretKey, region, folderPath, filePattern, enableEncryption, enableVersioning, maxFileSize, node.id, onNodeUpdate]);

  const providerOptions = [
    { label: 'Amazon S3', value: 'aws_s3' },
    { label: 'Google Cloud Storage', value: 'gcp_storage' },
    { label: 'Azure Blob Storage', value: 'azure_blob' },
    { label: 'MinIO', value: 'minio' },
    { label: 'Local FileSystem', value: 'local' }
  ];

  const regionOptions = [
    { label: 'US East 1', value: 'us-east-1' },
    { label: 'US West 2', value: 'us-west-2' },
    { label: 'EU West 1', value: 'eu-west-1' },
    { label: 'Asia Pacific', value: 'ap-south-1' }
  ];

  const generateConnectionString = (): string => {
    switch (storageProvider) {
      case 'aws_s3':
        return `s3://${bucketName}${folderPath}`;
      case 'gcp_storage':
        return `gs://${bucketName}${folderPath}`;
      case 'azure_blob':
        return `https://${bucketName}.blob.core.windows.net${folderPath}`;
      case 'local':
        return `file://${folderPath}`;
      default:
        return `${storageProvider}://${bucketName}${folderPath}`;
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <FileText className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">File Storage Configuration</h3>
      </div>

      <TextInput
        label="Node Name"
        value={nodeName}
        placeholder="Enter node name"
        onChange={setNodeName}
      />

      <SelectInput
        label="Storage Provider"
        value={storageProvider}
        options={providerOptions}
        onChange={setStorageProvider}
      />

      {storageProvider !== 'local' && (
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            label="Bucket/Container Name"
            value={bucketName}
            placeholder="my-bucket"
            onChange={setBucketName}
          />

          {(storageProvider.includes('aws') || storageProvider.includes('gcp')) && (
            <SelectInput
              label="Region"
              value={region}
              options={regionOptions}
              onChange={setRegion}
            />
          )}
        </div>
      )}

      {storageProvider !== 'local' && (
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            label="Access Key"
            value={accessKey}
            placeholder="Your access key"
            onChange={setAccessKey}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Secret Key
            </label>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your secret key"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <TextInput
          label="Folder Path"
          value={folderPath}
          placeholder="/data/files/"
          onChange={setFolderPath}
        />

        <TextInput
          label="File Pattern"
          value={filePattern}
          placeholder="*.csv"
          onChange={setFilePattern}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Max File Size (MB)
        </label>
        <input
          type="number"
          min="1"
          max="1000"
          value={maxFileSize}
          onChange={(e) => setMaxFileSize(parseInt(e.target.value) || 100)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="space-y-3">
        <CheckboxInput
          label="Enable Encryption"
          checked={enableEncryption}
          onChange={setEnableEncryption}
        />

        <CheckboxInput
          label="Enable Versioning"
          checked={enableVersioning}
          onChange={setEnableVersioning}
        />
      </div>

      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">Storage URL:</p>
        <code className="text-xs text-blue-700 dark:text-blue-300 break-all">
          {generateConnectionString()}
        </code>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
          Pattern: {filePattern} | Max Size: {maxFileSize}MB
        </p>
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <strong>Node ID:</strong> {node.id}
      </div>
    </div>
  );
};

export default FileStorageConfigurator;
