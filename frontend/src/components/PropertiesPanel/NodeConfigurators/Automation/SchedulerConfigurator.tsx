// frontend/src/components/PropertiesPanel/NodeConfigurators/SchedulerConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Clock } from 'lucide-react';
import TextInput from '../../../Shared/TextInput';
import SelectInput from '../../../Shared/SelectInput';
import CheckboxInput from '../../../Shared/CheckboxInput';

interface ConfiguratorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, newData: any) => void;
}

const SchedulerConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [scheduleType, setScheduleType] = useState(node.data.parameters?.scheduleType || 'cron');
  const [cronExpression, setCronExpression] = useState(node.data.parameters?.cronExpression || '0 0 * * *');
  const [intervalValue, setIntervalValue] = useState(node.data.parameters?.intervalValue || 24);
  const [intervalUnit, setIntervalUnit] = useState(node.data.parameters?.intervalUnit || 'hours');
  const [startDate, setStartDate] = useState(node.data.parameters?.startDate || '');
  const [endDate, setEndDate] = useState(node.data.parameters?.endDate || '');
  const [enabled, setEnabled] = useState(node.data.parameters?.enabled ?? true);
  const [timezone, setTimezone] = useState(node.data.parameters?.timezone || 'UTC');
  const [maxInstances, setMaxInstances] = useState(node.data.parameters?.maxInstances || 1);
  const [retryOnFailure, setRetryOnFailure] = useState(node.data.parameters?.retryOnFailure ?? true);
  const [maxRetries, setMaxRetries] = useState(node.data.parameters?.maxRetries || 3);

  useEffect(() => {
    setNodeName(node.data.label || '');
    const params = node.data.parameters || {};
    setScheduleType(params.scheduleType || 'cron');
    setCronExpression(params.cronExpression || '0 0 * * *');
    setIntervalValue(params.intervalValue || 24);
    setIntervalUnit(params.intervalUnit || 'hours');
    setStartDate(params.startDate || '');
    setEndDate(params.endDate || '');
    setEnabled(params.enabled ?? true);
    setTimezone(params.timezone || 'UTC');
    setMaxInstances(params.maxInstances || 1);
    setRetryOnFailure(params.retryOnFailure ?? true);
    setMaxRetries(params.maxRetries || 3);
  }, [node]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, {
        label: nodeName,
        parameters: {
          scheduleType,
          cronExpression: scheduleType === 'cron' ? cronExpression : undefined,
          intervalValue: scheduleType === 'interval' ? intervalValue : undefined,
          intervalUnit: scheduleType === 'interval' ? intervalUnit : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          enabled,
          timezone,
          maxInstances,
          retryOnFailure,
          maxRetries: retryOnFailure ? maxRetries : undefined
        }
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, scheduleType, cronExpression, intervalValue, intervalUnit, startDate, endDate, enabled, timezone, maxInstances, retryOnFailure, maxRetries, node.id, onNodeUpdate]);

  const scheduleTypeOptions = [
    { label: 'Cron Expression', value: 'cron' },
    { label: 'Fixed Interval', value: 'interval' },
    { label: 'Run Once', value: 'once' }
  ];

  const intervalUnitOptions = [
    { label: 'Minutes', value: 'minutes' },
    { label: 'Hours', value: 'hours' },
    { label: 'Days', value: 'days' },
    { label: 'Weeks', value: 'weeks' }
  ];

  const timezoneOptions = [
    { label: 'UTC', value: 'UTC' },
    { label: 'US/Eastern', value: 'US/Eastern' },
    { label: 'US/Pacific', value: 'US/Pacific' },
    { label: 'Europe/London', value: 'Europe/London' },
    { label: 'Asia/Tokyo', value: 'Asia/Tokyo' },
    { label: 'Asia/Kolkata', value: 'Asia/Kolkata' }
  ];

  const getCronDescription = (): string => {
    const commonPatterns: Record<string, string> = {
      '0 0 * * *': 'Daily at midnight',
      '0 */6 * * *': 'Every 6 hours',
      '0 0 * * 0': 'Weekly on Sunday',
      '0 0 1 * *': 'Monthly on 1st',
      '*/15 * * * *': 'Every 15 minutes'
    };
    return commonPatterns[cronExpression] || 'Custom schedule';
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Clock className="h-5 w-5 text-yellow-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Scheduler Configuration</h3>
      </div>

      <TextInput
        label="Node Name"
        value={nodeName}
        placeholder="Enter node name"
        onChange={setNodeName}
      />

      <SelectInput
        label="Schedule Type"
        value={scheduleType}
        options={scheduleTypeOptions}
        onChange={setScheduleType}
      />

      {scheduleType === 'cron' && (
        <div>
          <TextInput
            label="Cron Expression"
            value={cronExpression}
            placeholder="0 0 * * *"
            onChange={setCronExpression}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {getCronDescription()}
          </p>
        </div>
      )}

      {scheduleType === 'interval' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Interval Value
            </label>
            <input
              type="number"
              min="1"
              value={intervalValue}
              onChange={(e) => setIntervalValue(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <SelectInput
            label="Interval Unit"
            value={intervalUnit}
            options={intervalUnitOptions}
            onChange={setIntervalUnit}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Date (Optional)
          </label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            End Date (Optional)
          </label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectInput
          label="Timezone"
          value={timezone}
          options={timezoneOptions}
          onChange={setTimezone}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Max Concurrent Instances
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={maxInstances}
            onChange={(e) => setMaxInstances(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="space-y-3">
        <CheckboxInput
          label="Schedule Enabled"
          checked={enabled}
          onChange={setEnabled}
        />

        <CheckboxInput
          label="Retry on Failure"
          checked={retryOnFailure}
          onChange={setRetryOnFailure}
        />

        {retryOnFailure && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Retries
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={maxRetries}
              onChange={(e) => setMaxRetries(parseInt(e.target.value) || 3)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
      </div>

      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded">
        <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">Schedule Summary:</p>
        <ul className="text-sm text-yellow-800 dark:text-yellow-200 mt-1 space-y-1">
          {scheduleType === 'cron' && <li>• {getCronDescription()}</li>}
          {scheduleType === 'interval' && <li>• Every {intervalValue} {intervalUnit}</li>}
          {scheduleType === 'once' && <li>• Single execution</li>}
          <li>• Timezone: {timezone}</li>
          <li>• Status: {enabled ? 'Enabled' : 'Disabled'}</li>
        </ul>
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <strong>Node ID:</strong> {node.id}
      </div>
    </div>
  );
};

export default SchedulerConfigurator;