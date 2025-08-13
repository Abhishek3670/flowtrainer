import { FC } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, MapPin } from 'lucide-react';
import { NodeData, ValidationError } from '../../types';
import { Node, Edge } from 'reactflow';

interface ValidationPanelProps {
  isOpen?: boolean;
  errors: ValidationError[];
  nodes: Node<NodeData>[];
  edges: Edge[];
  onClose?: () => void;
  onFocusNode: (nodeId: string) => void;
}

const severityIcon = {
  error: <AlertCircle className="w-5 h-5 text-red-600" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  info: <CheckCircle className="w-5 h-5 text-green-600" />,
};

const ValidationPanel: FC<ValidationPanelProps> = ({
  /* isOpen, */
  /* onClose, */
  errors,
  nodes,
  edges,
  onFocusNode,
}) => {
  const hasErrors = errors.length > 0;

  // Create workflow summary without ReactFlow
  const workflowStats = {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodeTypes: nodes.reduce((acc, node) => {
      const nodeType = node.data?.nodeType || 'unknown';
      acc[nodeType] = (acc[nodeType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  return (
    <div className="h-full overflow-y-auto">
      {hasErrors ? (
        <div className="space-y-3">
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h4 className="font-medium text-red-800 dark:text-red-200">
                {errors.length} Validation {errors.length === 1 ? 'Error' : 'Errors'} Found
              </h4>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300">
              Fix these issues before running the pipeline.
            </p>
          </div>

          {errors.map((error, i) => (
            <div
              key={i}
              className="p-3 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-lg cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              onClick={() => error.nodeId !== 'workflow' && onFocusNode(error.nodeId)}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {severityIcon[error.severity || 'error']}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {error.message}
                  </p>
                  {error.nodeId !== 'workflow' && (
                    <div className="flex items-center mt-2 space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Node: {error.nodeId}
                      </span>
                      <button className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400">
                        Focus Node →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Success State */}
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-green-800 dark:text-green-200">
                Workflow Valid
              </h4>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              Your workflow is ready to run!
            </p>
          </div>

          {/* Workflow Statistics */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              Workflow Summary
            </h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Nodes:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {workflowStats.nodeCount}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Connections:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {workflowStats.edgeCount}
                </span>
              </div>
            </div>

            {Object.keys(workflowStats.nodeTypes).length > 0 && (
              <div className="mt-4">
                <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Node Types:
                </h5>
                <div className="space-y-1">
                  {Object.entries(workflowStats.nodeTypes).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400 capitalize">
                        {type.replace('-', ' ')}
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              Ready to Execute
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Your workflow has passed all validation checks.
            </p>
            <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors">
              Run Pipeline
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationPanel;
