// frontend/src/components/PropertiesPanel/NodeConfigurators/GenericConfigurator.tsx

import React from 'react';
import { Node } from 'reactflow';

interface ConfiguratorProps {
  node: Node;
  onNodeUpdate: (nodeId: string, newData: any) => void;
}

const GenericConfigurator: React.FC<ConfiguratorProps> = ({ node }) => (
  <div>
    <h3 className="text-lg font-medium mb-4">Node Properties</h3>
    <p>Selected node type: <strong>{node.data.nodeType || node.id}</strong></p>
    <p>Node ID: {node.id}</p>
    <p>No configurable properties implemented yet.</p>
  </div>
);

export default GenericConfigurator;
