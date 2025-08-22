// frontend/src/components/PropertiesPanel/NodeConfigurators/ModelDeployConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Zap } from 'lucide-react';
import TextInput from '../../../../Shared/TextInput';
import SelectInput from '../../../../Shared/SelectInput';
import CheckboxInput from '../../../../Shared/CheckboxInput';
import NumberInput from '../../../../Shared/NumberInput';

interface ConfiguratorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, newData: any) => void;
}

const ModelDeployConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [deploymentTarget, setDeploymentTarget] = useState(node.data.parameters?.deploymentTarget || 'docker');
  const [environment, setEnvironment] = useState(node.data.parameters?.environment || 'production');
  const [scalingType, setScalingType] = useState(node.data.parameters?.scalingType || 'manual');
  const [minReplicas, setMinReplicas] = useState(node.data.parameters?.minReplicas || 1);
  const [maxReplicas, setMaxReplicas] = useState(node.data.parameters?.maxReplicas || 10);
  const [cpuLimit, setCpuLimit] = useState(node.data.parameters?.cpuLimit || '500m');
  const [memoryLimit, setMemoryLimit] = useState(node.data.parameters?.memoryLimit || '1Gi');
  const [enableHealthCheck, setEnableHealthCheck] = useState(node.data.parameters?.enableHealthCheck ?? true);
  const [healthCheckPath, setHealthCheckPath] = useState(node.data.parameters?.healthCheckPath || '/health');
  const [enableLogging, setEnableLogging] = useState(node.data.parameters?.enableLogging ?? true);
  const [logLevel, setLogLevel] = useState(node.data.parameters?.logLevel || 'INFO');
  const [enableMetrics, setEnableMetrics] = useState(node.data.parameters?.enableMetrics ?? true);

  useEffect(() => {
    setNodeName(node.data.label || '');
    const params = node.data.parameters || {};
    setDeploymentTarget(params.deploymentTarget || 'docker');
    setEnvironment(params.environment || 'production');
    setScalingType(params.scalingType || 'manual');
    setMinReplicas(params.minReplicas || 1);
    setMaxReplicas(params.maxReplicas || 10);
    setCpuLimit(params.cpuLimit || '500m');
    setMemoryLimit(params.memoryLimit || '1Gi');
    setEnableHealthCheck(params.enableHealthCheck ?? true);
    setHealthCheckPath(params.healthCheckPath || '/health');
    setEnableLogging(params.enableLogging ?? true);
    setLogLevel(params.logLevel || 'INFO');
    setEnableMetrics(params.enableMetrics ?? true);
  }, [node]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, {
        label: nodeName,
        parameters: {
          deploymentTarget,
          environment,
          scalingType,
          minReplicas: scalingType === 'auto' ? minReplicas : undefined,
          maxReplicas: scalingType === 'auto' ? maxReplicas : undefined,
          cpuLimit,
          memoryLimit,
          enableHealthCheck,
          healthCheckPath: enableHealthCheck ? healthCheckPath : undefined,
          enableLogging,
          logLevel: enableLogging ? logLevel : undefined,
          enableMetrics
        }
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, deploymentTarget, environment, scalingType, minReplicas, maxReplicas, cpuLimit, memoryLimit, enableHealthCheck, healthCheckPath, enableLogging, logLevel, enableMetrics, node.id, onNodeUpdate]);

  const targetOptions = [
    { label: 'Docker Container', value: 'docker' },
    { label: 'Kubernetes', value: 'kubernetes' },
    { label: 'AWS Lambda', value: 'aws_lambda' },
    { label: 'Google Cloud Run', value: 'gcp_run' },
    { label: 'Azure Container Instances', value: 'azure_aci' },
    { label: 'Local Server', value: 'local' }
  ];

  const environmentOptions = [
    { label: 'Production', value: 'production' },
    { label: 'Staging', value: 'staging' },
    { label: 'Development', value: 'development' },
    { label: 'Testing', value: 'testing' }
  ];

  const scalingOptions = [
    { label: 'Manual', value: 'manual' },
    { label: 'Auto Scaling', value: 'auto' },
    { label: 'Fixed', value: 'fixed' }
  ];

  const logLevelOptions = [
    { label: 'DEBUG', value: 'DEBUG' },
    { label: 'INFO', value: 'INFO' },
    { label: 'WARNING', value: 'WARNING' },
    { label: 'ERROR', value: 'ERROR' }
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Zap className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Model Deployment Configuration</h3>
      </div>

      <TextInput
        label="Node Name"
        value={nodeName}
        placeholder="Enter node name"
        onChange={setNodeName}
      />

      <div className="grid grid-cols-2 gap-4">
        <SelectInput
          label="Deployment Target"
          value={deploymentTarget}
          options={targetOptions}
          onChange={setDeploymentTarget}
        />

        <SelectInput
          label="Environment"
          value={environment}
          options={environmentOptions}
          onChange={setEnvironment}
        />
      </div>

      <div className="space-y-3">
        <SelectInput
          label="Scaling Strategy"
          value={scalingType}
          options={scalingOptions}
          onChange={setScalingType}
        />

        {scalingType === 'auto' && (
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="Min Replicas"
              value={minReplicas}
              onChange={setMinReplicas}
            />

            <NumberInput
              label="Max Replicas"
              value={maxReplicas}
              onChange={setMaxReplicas}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextInput
          label="CPU Limit"
          value={cpuLimit}
          placeholder="500m"
          onChange={setCpuLimit}
        />

        <TextInput
          label="Memory Limit"
          value={memoryLimit}
          placeholder="1Gi"
          onChange={setMemoryLimit}
        />
      </div>

      <div className="space-y-3">
        <CheckboxInput
          label="Enable Health Checks"
          checked={enableHealthCheck}
          onChange={setEnableHealthCheck}
        />

        {enableHealthCheck && (
          <TextInput
            label="Health Check Path"
            value={healthCheckPath}
            placeholder="/health"
            onChange={setHealthCheckPath}
          />
        )}
      </div>

      <div className="space-y-3">
        <CheckboxInput
          label="Enable Logging"
          checked={enableLogging}
          onChange={setEnableLogging}
        />

        {enableLogging && (
          <SelectInput
            label="Log Level"
            value={logLevel}
            options={logLevelOptions}
            onChange={setLogLevel}
          />
        )}

        <CheckboxInput
          label="Enable Metrics Collection"
          checked={enableMetrics}
          onChange={setEnableMetrics}
        />
      </div>

      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded">
        <p className="text-sm text-green-800 dark:text-green-200 font-medium">Deployment Summary:</p>
        <ul className="text-sm text-green-800 dark:text-green-200 mt-1 space-y-1">
          <li>• Target: {targetOptions.find(t => t.value === deploymentTarget)?.label}</li>
          <li>• Environment: {environment}</li>
          <li>• Resources: {cpuLimit} CPU, {memoryLimit} Memory</li>
          {scalingType === 'auto' && <li>• Auto-scaling: {minReplicas}-{maxReplicas} replicas</li>}
          {enableHealthCheck && <li>• Health checks enabled</li>}
        </ul>
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <strong>Node ID:</strong> {node.id}
      </div>
    </div>
  );
};

export default ModelDeployConfigurator;
