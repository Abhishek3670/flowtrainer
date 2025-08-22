// frontend/src/components/PropertiesPanel/NodeConfigurators/DatabaseConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Database, TestTube, CheckCircle, AlertCircle } from 'lucide-react';
import TextInput from '../../../Shared/TextInput';
import SelectInput from '../../../Shared/SelectInput';
import CheckboxInput from '../../../Shared/CheckboxInput';
import NumberInput from '../../../Shared/NumberInput';

interface ConfiguratorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, newData: any) => void;
}

const DatabaseConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [databaseType, setDatabaseType] = useState(node.data.parameters?.databaseType || 'postgresql');
  const [host, setHost] = useState(node.data.parameters?.host || 'localhost');
  const [port, setPort] = useState(node.data.parameters?.port || 5432);
  const [database, setDatabase] = useState(node.data.parameters?.database || '');
  const [username, setUsername] = useState(node.data.parameters?.username || '');
  const [password, setPassword] = useState(node.data.parameters?.password || '');
  const [tableName, setTableName] = useState(node.data.parameters?.tableName || '');
  const [query, setQuery] = useState(node.data.parameters?.query || '');
  const [useCustomQuery, setUseCustomQuery] = useState(node.data.parameters?.useCustomQuery || false);
  const [sslMode, setSslMode] = useState(node.data.parameters?.sslMode || 'prefer');
  const [connectionTimeout, setConnectionTimeout] = useState(node.data.parameters?.connectionTimeout || 30);

  // Sync with node data on node change
  useEffect(() => {
    setNodeName(node.data.label || '');
    const params = node.data.parameters || {};
    setDatabaseType(params.databaseType || 'postgresql');
    setHost(params.host || 'localhost');
    setPort(params.port || getDefaultPort(params.databaseType || 'postgresql'));
    setDatabase(params.database || '');
    setUsername(params.username || '');
    setPassword(params.password || '');
    setTableName(params.tableName || '');
    setQuery(params.query || '');
    setUseCustomQuery(params.useCustomQuery || false);
    setSslMode(params.sslMode || 'prefer');
    setConnectionTimeout(params.connectionTimeout || 30);
  }, [node]);

  // Update port when database type changes
  useEffect(() => {
    setPort(getDefaultPort(databaseType));
  }, [databaseType]);

  // Update node with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, {
        label: nodeName,
        parameters: {
          databaseType,
          host,
          port,
          database,
          username,
          password,
          tableName: useCustomQuery ? undefined : tableName,
          query: useCustomQuery ? query : undefined,
          useCustomQuery,
          sslMode,
          connectionTimeout
        }
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, databaseType, host, port, database, username, password, tableName, query, useCustomQuery, sslMode, connectionTimeout, node.id, onNodeUpdate]);

  const getDefaultPort = (dbType: string): number => {
    const ports: Record<string, number> = {
      'postgresql': 5432,
      'mysql': 3306,
      'sqlite': 0,
      'mongodb': 27017,
      'redis': 6379,
      'mssql': 1433,
      'oracle': 1521
    };
    return ports[dbType] || 5432;
  };

  const databaseOptions = [
    { label: 'PostgreSQL', value: 'postgresql' },
    { label: 'MySQL', value: 'mysql' },
    { label: 'SQLite', value: 'sqlite' },
    { label: 'MongoDB', value: 'mongodb' },
    { label: 'Redis', value: 'redis' },
    { label: 'SQL Server', value: 'mssql' },
    { label: 'Oracle', value: 'oracle' }
  ];

  const sslOptions = [
    { label: 'Prefer', value: 'prefer' },
    { label: 'Require', value: 'require' },
    { label: 'Disable', value: 'disable' },
    { label: 'Allow', value: 'allow' }
  ];

  const generateConnectionString = (): string => {
    if (databaseType === 'sqlite') {
      return `sqlite:///${database}`;
    }
    if (databaseType === 'mongodb') {
      return `mongodb://${username}:${password}@${host}:${port}/${database}`;
    }
    return `${databaseType}://${username}:${password}@${host}:${port}/${database}`;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Database className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Database Configuration</h3>
      </div>

      <TextInput
        label="Node Name"
        value={nodeName}
        placeholder="Enter node name"
        onChange={setNodeName}
      />

      <SelectInput
        label="Database Type"
        value={databaseType}
        options={databaseOptions}
        onChange={setDatabaseType}
      />

      {databaseType !== 'sqlite' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              label="Host"
              value={host}
              placeholder="localhost"
              onChange={setHost}
            />
            <NumberInput
              label="Port"
              value={port}
              onChange={setPort}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextInput
              label="Username"
              value={username}
              placeholder="database username"
              onChange={setUsername}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="database password"
              />
            </div>
          </div>
        </>
      )}

      <TextInput
        label="Database Name"
        value={database}
        placeholder="database name"
        onChange={setDatabase}
      />

      <div className="space-y-3">
        <CheckboxInput
          label="Use Custom Query"
          checked={useCustomQuery}
          onChange={setUseCustomQuery}
        />

        {useCustomQuery ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              SQL Query
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="SELECT * FROM your_table WHERE condition..."
            />
          </div>
        ) : (
          <TextInput
            label="Table Name"
            value={tableName}
            placeholder="table_name"
            onChange={setTableName}
          />
        )}
      </div>

      {databaseType !== 'sqlite' && databaseType !== 'mongodb' && (
        <div className="grid grid-cols-2 gap-4">
          <SelectInput
            label="SSL Mode"
            value={sslMode}
            options={sslOptions}
            onChange={setSslMode}
          />
          <NumberInput
            label="Connection Timeout (s)"
            value={connectionTimeout}
            onChange={setConnectionTimeout}
          />
        </div>
      )}

      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">Connection String Preview:</p>
        <code className="text-xs text-blue-700 dark:text-blue-300 break-all">
          {generateConnectionString()}
        </code>
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <strong>Node ID:</strong> {node.id}
      </div>
    </div>
  );
};

export default DatabaseConfigurator;
