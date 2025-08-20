// frontend/src/components/PropertiesPanel/NodeConfigurators/DatasetUploadConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { CheckCircle, AlertCircle, X, Database, Eye } from 'lucide-react';
import { UploadProgress, FileData, DatasetPreview } from '../../../types';
import { fileAPI } from '../../../services/fileApi';
import FileUploadSection from '../../Shared/FileUploadSection';
import CheckboxInput from '../../Shared/CheckboxInput';
import SelectInput from '../../Shared/SelectInput';
import TextInput from '../../Shared/TextInput';
import DataPreview from '../../Shared/DataPreview';

interface ConfiguratorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, newData: Partial<Node['data']>) => void;
}

const DatasetUploadConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(node.data.selectedFile || null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [datasetPreview, setDatasetPreview] = useState<DatasetPreview | null>(null);
  
  // CSV parsing parameters
  const [separator, setSeparator] = useState(node.data.parameters?.separator || ',');
  const [hasHeader, setHasHeader] = useState(node.data.parameters?.hasHeader ?? true);
  const [encoding, setEncoding] = useState(node.data.parameters?.encoding || 'utf-8');
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Sync from node.data
  useEffect(() => {
    setSelectedFile(node.data.selectedFile || null);
    setDatasetPreview(node.data.preview || null);
    const params = node.data.parameters || {};
    setSeparator(params.separator || ',');
    setHasHeader(params.hasHeader ?? true);
    setEncoding(params.encoding || 'utf-8');
  }, [node.data.selectedFile, node.data.preview, node.data.parameters]);

  useEffect(() => {
    setNodeName(node.data.label || '');
    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgress(null);
    setValidationErrors([]);
  }, [node]);

  // Update node name with debounce
  useEffect(() => {
    const handler = setTimeout(() => onNodeUpdate(node.id, { label: nodeName }), 500);
    return () => clearTimeout(handler);
  }, [nodeName, node.id, onNodeUpdate]);

  // Update parameters with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, { 
        parameters: { separator, hasHeader, encoding } 
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [separator, hasHeader, encoding, node.id, onNodeUpdate]);

  // Validate dataset file
  const validateFile = (file: File): string[] => {
    const errors: string[] = [];
    
    const validTypes = ['.csv', 'text/csv', 'application/csv'];
    const isValidType = validTypes.some(type => 
      file.type === type || file.name.toLowerCase().endsWith('.csv')
    );
    
    if (!isValidType) {
      errors.push('Please upload a CSV file');
    }
    
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push(`File size exceeds 100MB limit (${fileAPI.formatFileSize(file.size)})`);
    }
    
    return errors;
  };

  // Generate dataset preview from an already uploaded file
  const generatePreview = async (
    fileId: string, 
    params: { separator: string; hasHeader: boolean; encoding: string }
  ): Promise<DatasetPreview | null> => {
    try {
      const response = await fileAPI.previewDataset(fileId, params);
      return response.data; // FIX: Return the nested data object
    } catch (error) {
      console.error('Preview generation failed:', error);
      return null;
    }
  };

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement> | File) => {
    let file: File | undefined;
    if ('target' in e) {
      file = e.target.files?.[0];
    } else {
      file = e;
    }
    if (!file) return;

    const errors = validateFile(file);
    if (errors.length > 0) {
      setValidationErrors(errors);
      setUploadError(errors[0]);
      return;
    }

    setValidationErrors([]);
    setUploading(true);
    onNodeUpdate(node.id, { status: 'uploading' });

    try {
      const uploadResp = await fileAPI.uploadDataset(file, setUploadProgress);
      const fileData = uploadResp.data!;
      
      // FIX: Generate preview using the new file's ID and current parsing params
      const preview = await generatePreview(fileData.id, { separator, hasHeader, encoding });
      
      setSelectedFile(fileData);
      setDatasetPreview(preview);
      onNodeUpdate(node.id, { 
        selectedFile: fileData, 
        preview,
        status: 'ready',
        validation: { isValid: true, errors: [] }
      });
      setUploadSuccess(`Uploaded "${file.name}" successfully`);
      setUploadError(null);
    } catch (err: any) {
      onNodeUpdate(node.id, { 
        status: 'error',
        validation: { isValid: false, errors: [err.message] }
      });
      setUploadError(err.message);
      setUploadSuccess(null);
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if ('target' in e) e.target.value = '';
    }
  };

  // Clear dataset
  const clearDataset = () => {
    setSelectedFile(null);
    setDatasetPreview(null);
    setUploadError(null);
    setUploadSuccess(null);
    setValidationErrors([]);
    onNodeUpdate(node.id, { 
      selectedFile: undefined, 
      preview: undefined, 
      status: 'empty',
      validation: undefined
    });
  };

  // Update preview when parameters change
  useEffect(() => {
    // FIX: Depend on selectedFile (which has the ID) instead of the raw file object
    if (selectedFile) {
      const updatePreview = async () => {
        const newPreview = await generatePreview(selectedFile.id, { separator, hasHeader, encoding });
        setDatasetPreview(newPreview);
        onNodeUpdate(node.id, { preview: newPreview });
      };
      updatePreview();
    }
  }, [separator, hasHeader, encoding, selectedFile, node.id, onNodeUpdate]);

  const separatorOptions = [
    { label: 'Comma (,)', value: ',' },
    { label: 'Semicolon (;)', value: ';' },
    { label: 'Tab', value: '\t' },
    { label: 'Pipe (|)', value: '|' }
  ];

  const encodingOptions = [
    { label: 'UTF-8', value: 'utf-8' },
    { label: 'Latin-1', value: 'latin-1' },
    { label: 'ASCII', value: 'ascii' }
  ];

  return (
    <div className="h-full bg-white dark:bg-gray-800 overflow-y-auto p-4 space-y-6">
      {/* Node Name */}
      <TextInput
        label="Node Name"
        value={nodeName}
        onChange={setNodeName}
        placeholder="Enter dataset node name..."
      />

      {/* Dataset Upload Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 flex items-center">
          <Database className="w-5 h-5 mr-2 text-blue-500" />
          Dataset Upload
        </h3>

        <FileUploadSection
          label="Upload CSV Dataset"
          accept=".csv,text/csv,application/csv"
          maxSize={100 * 1024 * 1024} // 100MB
          uploadProgress={uploadProgress}
          onFileSelect={handleFileChange}
          disabled={uploading}
        />

        {validationErrors.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">Validation Issues:</h4>
            <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {uploadSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-700 dark:text-green-400">{uploadSuccess}</span>
            <button 
              onClick={() => setUploadSuccess(null)} 
              className="ml-auto text-green-500 hover:text-green-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {uploadError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-400">{uploadError}</span>
            <button 
              onClick={() => setUploadError(null)} 
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* CSV Parsing Options */}
      {selectedFile && (
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">CSV Parsing Options</h4>
          <div className="space-y-4">
            <SelectInput
              label="Field Separator"
              value={separator}
              options={separatorOptions}
              onChange={setSeparator}
            />
            
            <CheckboxInput
              label="First row contains headers"
              checked={hasHeader}
              onChange={setHasHeader}
            />
            
            <SelectInput
              label="File Encoding"
              value={encoding}
              options={encodingOptions}
              onChange={setEncoding}
            />
          </div>
        </div>
      )}

      {/* Dataset Preview */}
      {datasetPreview && !uploading && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              Dataset Preview
            </span>
            <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {datasetPreview.totalRows} rows × {datasetPreview.headers.length} columns
            </span>
          </div>

          <DataPreview dataset={datasetPreview} />

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {selectedFile?.originalName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {selectedFile ? fileAPI.formatFileSize(selectedFile.size) : ''}
            </span>
          </div>
          
          {selectedFile && (
            <div className="mt-3 flex justify-center">
              <button
                onClick={clearDataset}
                className="text-sm bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
              >
                Remove Dataset
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dataset Info */}
      {selectedFile && !uploading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-blue-700 dark:text-blue-400 font-medium">Dataset Ready</span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
            Dataset is uploaded and ready for processing
          </p>
        </div>
      )}
    </div>
  );
};

export default DatasetUploadConfigurator;