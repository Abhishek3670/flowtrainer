// frontend/src/components/PropertiesPanel/NodeConfigurators/DataPreprocessingConfigurator.tsx

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

const DataPreprocessingConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [scalingMethod, setScalingMethod] = useState(node.data.parameters?.scalingMethod || 'standard');
  const [missingValueStrategy, setMissingValueStrategy] = useState(node.data.parameters?.missingValueStrategy || 'mean');
  const [outlierMethod, setOutlierMethod] = useState(node.data.parameters?.outlierMethod || 'iqr');
  const [outlierThreshold, setOutlierThreshold] = useState(node.data.parameters?.outlierThreshold || 1.5);
  const [encodingMethod, setEncodingMethod] = useState(node.data.parameters?.encodingMethod || 'onehot');
  const [dropColumns, setDropColumns] = useState(node.data.parameters?.dropColumns || '');
  const [createDummies, setCreateDummies] = useState(node.data.parameters?.createDummies ?? true);
  const [handleOutliers, setHandleOutliers] = useState(node.data.parameters?.handleOutliers ?? true);
  const [handleMissing, setHandleMissing] = useState(node.data.parameters?.handleMissing ?? true);
  const [featureSelection, setFeatureSelection] = useState(node.data.parameters?.featureSelection ?? false);
  const [nFeatures, setNFeatures] = useState(node.data.parameters?.nFeatures || 10);

  // Sync with node data on node change
  useEffect(() => {
    setNodeName(node.data.label || '');
    const params = node.data.parameters || {};
    setScalingMethod(params.scalingMethod || 'standard');
    setMissingValueStrategy(params.missingValueStrategy || 'mean');
    setOutlierMethod(params.outlierMethod || 'iqr');
    setOutlierThreshold(params.outlierThreshold || 1.5);
    setEncodingMethod(params.encodingMethod || 'onehot');
    setDropColumns(params.dropColumns || '');
    setCreateDummies(params.createDummies ?? true);
    setHandleOutliers(params.handleOutliers ?? true);
    setHandleMissing(params.handleMissing ?? true);
    setFeatureSelection(params.featureSelection ?? false);
    setNFeatures(params.nFeatures || 10);
  }, [node]);

  // Update node with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, {
        label: nodeName,
        parameters: {
          scalingMethod,
          missingValueStrategy: handleMissing ? missingValueStrategy : undefined,
          outlierMethod: handleOutliers ? outlierMethod : undefined,
          outlierThreshold: handleOutliers ? outlierThreshold : undefined,
          encodingMethod: createDummies ? encodingMethod : undefined,
          dropColumns: dropColumns.trim() || undefined,
          createDummies,
          handleOutliers,
          handleMissing,
          featureSelection,
          nFeatures: featureSelection ? nFeatures : undefined
        }
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, scalingMethod, missingValueStrategy, outlierMethod, outlierThreshold, encodingMethod, dropColumns, createDummies, handleOutliers, handleMissing, featureSelection, nFeatures, node.id, onNodeUpdate]);

  const scalingOptions = [
    { label: 'StandardScaler', value: 'standard' },
    { label: 'MinMaxScaler', value: 'minmax' },
    { label: 'RobustScaler', value: 'robust' },
    { label: 'Normalizer', value: 'normalizer' },
    { label: 'No Scaling', value: 'none' }
  ];

  const missingValueOptions = [
    { label: 'Mean Imputation', value: 'mean' },
    { label: 'Median Imputation', value: 'median' },
    { label: 'Mode Imputation', value: 'most_frequent' },
    { label: 'Forward Fill', value: 'ffill' },
    { label: 'Backward Fill', value: 'bfill' },
    { label: 'Drop Rows', value: 'drop' }
  ];

  const outlierOptions = [
    { label: 'IQR Method', value: 'iqr' },
    { label: 'Z-Score', value: 'zscore' },
    { label: 'Isolation Forest', value: 'isolation' },
    { label: 'Local Outlier Factor', value: 'lof' }
  ];

  const encodingOptions = [
    { label: 'One-Hot Encoding', value: 'onehot' },
    { label: 'Label Encoding', value: 'label' },
    { label: 'Target Encoding', value: 'target' },
    { label: 'Binary Encoding', value: 'binary' }
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Settings className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Preprocessing Configuration</h3>
      </div>

      <TextInput
        label="Node Name"
        value={nodeName}
        placeholder="Enter node name"
        onChange={setNodeName}
      />

      <SelectInput
        label="Scaling Method"
        value={scalingMethod}
        options={scalingOptions}
        onChange={setScalingMethod}
      />

      <div className="space-y-3">
        <CheckboxInput
          label="Handle Missing Values"
          checked={handleMissing}
          onChange={setHandleMissing}
        />

        {handleMissing && (
          <SelectInput
            label="Missing Value Strategy"
            value={missingValueStrategy}
            options={missingValueOptions}
            onChange={setMissingValueStrategy}
          />
        )}
      </div>

      <div className="space-y-3">
        <CheckboxInput
          label="Handle Outliers"
          checked={handleOutliers}
          onChange={setHandleOutliers}
        />

        {handleOutliers && (
          <>
            <SelectInput
              label="Outlier Detection Method"
              value={outlierMethod}
              options={outlierOptions}
              onChange={setOutlierMethod}
            />
            
            {(outlierMethod === 'iqr' || outlierMethod === 'zscore') && (
              <NumberInput
                label="Threshold Multiplier"
                value={outlierThreshold}
                onChange={setOutlierThreshold}
              />
            )}
          </>
        )}
      </div>

      <div className="space-y-3">
        <CheckboxInput
          label="Encode Categorical Variables"
          checked={createDummies}
          onChange={setCreateDummies}
        />

        {createDummies && (
          <SelectInput
            label="Encoding Method"
            value={encodingMethod}
            options={encodingOptions}
            onChange={setEncodingMethod}
          />
        )}
      </div>

      <TextInput
        label="Drop Columns (comma-separated)"
        value={dropColumns}
        placeholder="col1, col2, col3"
        onChange={setDropColumns}
      />

      <div className="space-y-3">
        <CheckboxInput
          label="Feature Selection"
          checked={featureSelection}
          onChange={setFeatureSelection}
        />

        {featureSelection && (
          <NumberInput
            label="Number of Features to Select"
            value={nFeatures}
            onChange={setNFeatures}
          />
        )}
      </div>

      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded">
        <p className="text-sm text-green-800 dark:text-green-200 font-medium">Pipeline Steps:</p>
        <ul className="text-sm text-green-800 dark:text-green-200 mt-1 space-y-1">
          {dropColumns && <li>• Drop specified columns</li>}
          {handleMissing && <li>• Handle missing values ({missingValueStrategy})</li>}
          {handleOutliers && <li>• Remove outliers ({outlierMethod})</li>}
          {createDummies && <li>• Encode categorical variables ({encodingMethod})</li>}
          <li>• Scale features ({scalingMethod})</li>
          {featureSelection && <li>• Select top {nFeatures} features</li>}
        </ul>
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <strong>Node ID:</strong> {node.id}
      </div>
    </div>
  );
};

export default DataPreprocessingConfigurator;
