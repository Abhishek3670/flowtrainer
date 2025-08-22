// frontend/src/components/PropertiesPanel/NodeConfigurators/PerformanceMonitorConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Activity } from 'lucide-react';
import TextInput from '../../../Shared/TextInput';
import SelectInput from '../../../Shared/SelectInput';
import CheckboxInput from '../../../Shared/CheckboxInput';
import NumberInput from '../../../Shared/NumberInput';

interface ConfiguratorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, newData: any) => void;
}

const PerformanceMonitorConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [monitoringInterval, setMonitoringInterval] = useState(node.data.parameters?.monitoringInterval || 60);
  const [metricsToTrack, setMetricsToTrack] = useState<string[]>(node.data.parameters?.metricsToTrack || ['accuracy', 'latency', 'throughput']);
  const [thresholds, setThresholds] = useState(node.data.parameters?.thresholds || '{}');
  const [alertMethod, setAlertMethod] = useState(node.data.parameters?.alertMethod || 'email');
  const [alertRecipients, setAlertRecipients] = useState(node.data.parameters?.alertRecipients || '');
  const [enableDashboard, setEnableDashboard] = useState(node.data.parameters?.enableDashboard || true);
  const [dashboardPort, setDashboardPort] = useState(node.data.parameters?.dashboardPort || 8080);
  const [logRetentionDays, setLogRetentionDays] = useState(node.data.parameters?.logRetentionDays || 30);
  const [enableAutoRetraining, setEnableAutoRetraining] = useState(node.data.parameters?.enableAutoRetraining || false);
  const [retrainingThreshold, setRetrainingThreshold] = useState(node.data.parameters?.retrainingThreshold || 0.05);
  const [dataSourcePath, setDataSourcePath] = useState(node.data.parameters?.dataSourcePath || '/api/predictions');

  // Sync with node data on node change
  useEffect(() => {
    setNodeName(node.data.label || '');
    const params = node.data.parameters || {};
    setMonitoringInterval(params.monitoringInterval || 60);
    setMetricsToTrack(params.metricsToTrack || ['accuracy', 'latency', 'throughput']);
    setThresholds(params.thresholds || '{}');
    setAlertMethod(params.alertMethod || 'email');
    setAlertRecipients(params.alertRecipients || '');
    setEnableDashboard(params.enableDashboard || true);
    setDashboardPort(params.dashboardPort || 8080);
    setLogRetentionDays(params.logRetentionDays || 30);
    setEnableAutoRetraining(params.enableAutoRetraining || false);
    setRetrainingThreshold(params.retrainingThreshold || 0.05);
    setDataSourcePath(params.dataSourcePath || '/api/predictions');
  }, [node]);

  // Update node with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, {
        label: nodeName,
        parameters: {
          monitoringInterval,
          metricsToTrack,
          thresholds: thresholds.trim() || '{}',
          alertMethod,
          alertRecipients: alertRecipients.trim() || undefined,
          enableDashboard,
          dashboardPort: enableDashboard ? dashboardPort : undefined,
          logRetentionDays,
          enableAutoRetraining,
          retrainingThreshold: enableAutoRetraining ? retrainingThreshold : undefined,
          dataSourcePath
        }
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, monitoringInterval, metricsToTrack, thresholds, alertMethod, alertRecipients, enableDashboard, dashboardPort, logRetentionDays, enableAutoRetraining, retrainingThreshold, dataSourcePath, node.id, onNodeUpdate]);

  const availableMetrics = [
    'accuracy', 'precision', 'recall', 'f1_score',
    'latency', 'throughput', 'error_rate', 'memory_usage',
    'cpu_usage', 'prediction_drift', 'data_drift'
  ];

  const alertMethodOptions = [
    { label: 'Email', value: 'email' },
    { label: 'Slack', value: 'slack' },
    { label: 'Webhook', value: 'webhook' },
    { label: 'SMS', value: 'sms' },
    { label: 'Dashboard Only', value: 'dashboard' }
  ];

  const handleMetricChange = (metric: string, checked: boolean) => {
    if (checked) {
      setMetricsToTrack([...metricsToTrack, metric]);
    } else {
      setMetricsToTrack(metricsToTrack.filter(m => m !== metric));
    }
  };

  const getDefaultThresholds = (): string => {
    return `{
  "accuracy": {"min": 0.85},
  "latency": {"max": 500},
  "throughput": {"min": 100},
  "error_rate": {"max": 0.05}
}`;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Activity className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Monitor Configuration</h3>
      </div>

      <TextInput
        label="Node Name"
        value={nodeName}
        placeholder="Enter node name"
        onChange={setNodeName}
      />

      <div className="grid grid-cols-2 gap-4">
        <NumberInput
          label="Monitoring Interval (seconds)"
          value={monitoringInterval}
          onChange={setMonitoringInterval}
        />

        <NumberInput
          label="Log Retention (days)"
          value={logRetentionDays}
          onChange={setLogRetentionDays}
        />
      </div>

      <TextInput
        label="Data Source Path"
        value={dataSourcePath}
        placeholder="/api/predictions"
        onChange={setDataSourcePath}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Metrics to Track
        </label>
        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded p-2">
          {availableMetrics.map(metric => (
            <label key={metric} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={metricsToTrack.includes(metric)}
                onChange={(e) => handleMetricChange(metric, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">{metric.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Alert Thresholds (JSON)
        </label>
        <textarea
          value={thresholds}
          onChange={(e) => setThresholds(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          placeholder={getDefaultThresholds()}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectInput
          label="Alert Method"
          value={alertMethod}
          options={alertMethodOptions}
          onChange={setAlertMethod}
        />

        <TextInput
          label="Alert Recipients"
          value={alertRecipients}
          placeholder="admin@example.com"
          onChange={setAlertRecipients}
        />
      </div>

      <div className="space-y-3">
        <CheckboxInput
          label="Enable Monitoring Dashboard"
          checked={enableDashboard}
          onChange={setEnableDashboard}
        />

        {enableDashboard && (
          <NumberInput
            label="Dashboard Port"
            value={dashboardPort}
            onChange={setDashboardPort}
          />
        )}
      </div>

      <div className="space-y-3">
        <CheckboxInput
          label="Enable Auto-Retraining"
          checked={enableAutoRetraining}
          onChange={setEnableAutoRetraining}
        />

        {enableAutoRetraining && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Performance Drop Threshold
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={retrainingThreshold}
              onChange={(e) => setRetrainingThreshold(parseFloat(e.target.value) || 0.05)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
      </div>

      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded">
        <p className="text-sm text-green-800 dark:text-green-200 font-medium">Monitoring Summary:</p>
        <ul className="text-sm text-green-800 dark:text-green-200 mt-1 space-y-1">
          <li>• Tracking {metricsToTrack.length} metrics every {monitoringInterval}s</li>
          <li>• Alerts via {alertMethodOptions.find(a => a.value === alertMethod)?.label}</li>
          {enableDashboard && <li>• Dashboard available at port {dashboardPort}</li>}
          {enableAutoRetraining && <li>• Auto-retrain when performance drops by {retrainingThreshold}</li>}
        </ul>
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <strong>Node ID:</strong> {node.id}
      </div>
    </div>
  );
};

export default PerformanceMonitorConfigurator;
