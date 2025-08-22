// frontend/src/components/PropertiesPanel/NodeConfigurators/AlertConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Bell } from 'lucide-react';
import TextInput from '../../../Shared/TextInput';
import SelectInput from '../../../Shared/SelectInput';
import CheckboxInput from '../../../Shared/CheckboxInput';

interface ConfiguratorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, newData: any) => void;
}

const AlertConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [alertType, setAlertType] = useState(node.data.parameters?.alertType || 'email');
  const [recipients, setRecipients] = useState(node.data.parameters?.recipients || '');
  const [alertConditions, setAlertConditions] = useState<string[]>(node.data.parameters?.alertConditions || ['error']);
  const [messageTemplate, setMessageTemplate] = useState(node.data.parameters?.messageTemplate || '');
  const [enabled, setEnabled] = useState(node.data.parameters?.enabled ?? true);

  useEffect(() => {
    setNodeName(node.data.label || '');
    const params = node.data.parameters || {};
    setAlertType(params.alertType || 'email');
    setRecipients(params.recipients || '');
    setAlertConditions(params.alertConditions || ['error']);
    setMessageTemplate(params.messageTemplate || '');
    setEnabled(params.enabled ?? true);
  }, [node]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, {
        label: nodeName,
        parameters: {
          alertType,
          recipients,
          alertConditions,
          messageTemplate: messageTemplate.trim() || undefined,
          enabled
        }
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, alertType, recipients, alertConditions, messageTemplate, enabled, node.id, onNodeUpdate]);

  const alertTypeOptions = [
    { label: 'Email', value: 'email' },
    { label: 'Slack', value: 'slack' },
    { label: 'SMS', value: 'sms' },
    { label: 'Webhook', value: 'webhook' }
  ];

  const availableConditions = ['error', 'warning', 'success', 'performance_drop', 'training_complete'];

  const handleConditionChange = (condition: string, checked: boolean) => {
    if (checked) {
      setAlertConditions([...alertConditions, condition]);
    } else {
      setAlertConditions(alertConditions.filter(c => c !== condition));
    }
  };

  const getDefaultMessage = (): string => {
    switch (alertType) {
      case 'email':
        return 'ML Pipeline Alert: {event} occurred at {timestamp}';
      case 'slack':
        return ':warning: ML Pipeline: {event} - {details}';
      case 'sms':
        return 'Alert: {event} in ML pipeline';
      case 'webhook':
        return '{"event": "{event}", "timestamp": "{timestamp}", "details": "{details}"}';
      default:
        return 'Alert: {event}';
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Bell className="h-5 w-5 text-yellow-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Alert Configuration</h3>
      </div>

      <TextInput
        label="Node Name"
        value={nodeName}
        placeholder="Enter node name"
        onChange={setNodeName}
      />

      <SelectInput
        label="Alert Type"
        value={alertType}
        options={alertTypeOptions}
        onChange={setAlertType}
      />

      <TextInput
        label="Recipients"
        value={recipients}
        placeholder="email@example.com, @channel, +1234567890"
        onChange={setRecipients}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Alert Conditions
        </label>
        <div className="grid grid-cols-2 gap-2 border border-gray-300 dark:border-gray-600 rounded p-2">
          {availableConditions.map(condition => (
            <label key={condition} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={alertConditions.includes(condition)}
                onChange={(e) => handleConditionChange(condition, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">{condition.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Message Template
        </label>
        <textarea
          value={messageTemplate}
          onChange={(e) => setMessageTemplate(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={getDefaultMessage()}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Available variables: {'{event}'}, {'{timestamp}'}, {'{details}'}
        </p>
      </div>

      <CheckboxInput
        label="Alerts Enabled"
        checked={enabled}
        onChange={setEnabled}
      />

      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <strong>Node ID:</strong> {node.id}
      </div>
    </div>
  );
};

export default AlertConfigurator;