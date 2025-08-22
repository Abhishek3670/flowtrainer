// frontend/src/components/PropertiesPanel/NodeConfigurators/APIEndpointConfigurator.tsx

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { Globe } from 'lucide-react';
import TextInput from '../../../../Shared/TextInput';
import SelectInput from '../../../../Shared/SelectInput';
import CheckboxInput from '../../../../Shared/CheckboxInput';
import NumberInput from '../../../../Shared/NumberInput';

interface ConfiguratorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, newData: any) => void;
}

const APIEndpointConfigurator: React.FC<ConfiguratorProps> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [endpointPath, setEndpointPath] = useState(node.data.parameters?.endpointPath || '/predict');
  const [httpMethod, setHttpMethod] = useState(node.data.parameters?.httpMethod || 'POST');
  const [port, setPort] = useState(node.data.parameters?.port || 8000);
  const [host, setHost] = useState(node.data.parameters?.host || '0.0.0.0');
  const [authentication, setAuthentication] = useState(node.data.parameters?.authentication || false);
  const [authMethod, setAuthMethod] = useState(node.data.parameters?.authMethod || 'api_key');
  const [rateLimiting, setRateLimiting] = useState(node.data.parameters?.rateLimiting || false);
  const [rateLimit, setRateLimit] = useState(node.data.parameters?.rateLimit || 100);
  const [cors, setCors] = useState(node.data.parameters?.cors || true);
  const [allowedOrigins, setAllowedOrigins] = useState(node.data.parameters?.allowedOrigins || '*');
  const [responseFormat, setResponseFormat] = useState(node.data.parameters?.responseFormat || 'json');
  const [includeMetadata, setIncludeMetadata] = useState(node.data.parameters?.includeMetadata || false);
  const [loggingEnabled, setLoggingEnabled] = useState(node.data.parameters?.loggingEnabled || true);
  const [swaggerDocs, setSwaggerDocs] = useState(node.data.parameters?.swaggerDocs || true);

  // Sync with node data on node change
  useEffect(() => {
    setNodeName(node.data.label || '');
    const params = node.data.parameters || {};
    setEndpointPath(params.endpointPath || '/predict');
    setHttpMethod(params.httpMethod || 'POST');
    setPort(params.port || 8000);
    setHost(params.host || '0.0.0.0');
    setAuthentication(params.authentication || false);
    setAuthMethod(params.authMethod || 'api_key');
    setRateLimiting(params.rateLimiting || false);
    setRateLimit(params.rateLimit || 100);
    setCors(params.cors || true);
    setAllowedOrigins(params.allowedOrigins || '*');
    setResponseFormat(params.responseFormat || 'json');
    setIncludeMetadata(params.includeMetadata || false);
    setLoggingEnabled(params.loggingEnabled || true);
    setSwaggerDocs(params.swaggerDocs || true);
  }, [node]);

  // Update node with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, {
        label: nodeName,
        parameters: {
          endpointPath,
          httpMethod,
          port,
          host,
          authentication,
          authMethod: authentication ? authMethod : undefined,
          rateLimiting,
          rateLimit: rateLimiting ? rateLimit : undefined,
          cors,
          allowedOrigins: cors ? allowedOrigins : undefined,
          responseFormat,
          includeMetadata,
          loggingEnabled,
          swaggerDocs
        }
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, endpointPath, httpMethod, port, host, authentication, authMethod, rateLimiting, rateLimit, cors, allowedOrigins, responseFormat, includeMetadata, loggingEnabled, swaggerDocs, node.id, onNodeUpdate]);

  const httpMethodOptions = [
    { label: 'POST', value: 'POST' },
    { label: 'GET', value: 'GET' },
    { label: 'PUT', value: 'PUT' },
    { label: 'PATCH', value: 'PATCH' }
  ];

  const authMethodOptions = [
    { label: 'API Key', value: 'api_key' },
    { label: 'Bearer Token', value: 'bearer' },
    { label: 'Basic Auth', value: 'basic' },
    { label: 'OAuth 2.0', value: 'oauth2' }
  ];

  const responseFormatOptions = [
    { label: 'JSON', value: 'json' },
    { label: 'XML', value: 'xml' },
    { label: 'Plain Text', value: 'text' },
    { label: 'CSV', value: 'csv' }
  ];

  const generateEndpointUrl = (): string => {
    return `http://${host}:${port}${endpointPath}`;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Globe className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">API Endpoint Configuration</h3>
      </div>

      <TextInput
        label="Node Name"
        value={nodeName}
        placeholder="Enter node name"
        onChange={setNodeName}
      />

      <div className="grid grid-cols-2 gap-4">
        <TextInput
          label="Endpoint Path"
          value={endpointPath}
          placeholder="/predict"
          onChange={setEndpointPath}
        />

        <SelectInput
          label="HTTP Method"
          value={httpMethod}
          options={httpMethodOptions}
          onChange={setHttpMethod}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextInput
          label="Host"
          value={host}
          placeholder="0.0.0.0"
          onChange={setHost}
        />

        <NumberInput
          label="Port"
          value={port}
          onChange={setPort}
        />
      </div>

      <div className="space-y-3">
        <CheckboxInput
          label="Enable Authentication"
          checked={authentication}
          onChange={setAuthentication}
        />

        {authentication && (
          <SelectInput
            label="Authentication Method"
            value={authMethod}
            options={authMethodOptions}
            onChange={setAuthMethod}
          />
        )}
      </div>

      <div className="space-y-3">
        <CheckboxInput
          label="Enable Rate Limiting"
          checked={rateLimiting}
          onChange={setRateLimiting}
        />

        {rateLimiting && (
          <NumberInput
            label="Requests per Minute"
            value={rateLimit}
            onChange={setRateLimit}
          />
        )}
      </div>

      <div className="space-y-3">
        <CheckboxInput
          label="Enable CORS"
          checked={cors}
          onChange={setCors}
        />

        {cors && (
          <TextInput
            label="Allowed Origins"
            value={allowedOrigins}
            placeholder="*"
            onChange={setAllowedOrigins}
          />
        )}
      </div>

      <SelectInput
        label="Response Format"
        value={responseFormat}
        options={responseFormatOptions}
        onChange={setResponseFormat}
      />

      <div className="space-y-3">
        <CheckboxInput
          label="Include Metadata in Response"
          checked={includeMetadata}
          onChange={setIncludeMetadata}
        />

        <CheckboxInput
          label="Enable Request Logging"
          checked={loggingEnabled}
          onChange={setLoggingEnabled}
        />

        <CheckboxInput
          label="Generate Swagger Documentation"
          checked={swaggerDocs}
          onChange={setSwaggerDocs}
        />
      </div>

      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">Endpoint URL:</p>
        <code className="text-xs text-blue-700 dark:text-blue-300 break-all">
          {generateEndpointUrl()}
        </code>
        {swaggerDocs && (
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            📖 Docs: {generateEndpointUrl().replace(endpointPath, '/docs')}
          </p>
        )}
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        <strong>Node ID:</strong> {node.id}
      </div>
    </div>
  );
};

export default APIEndpointConfigurator;
