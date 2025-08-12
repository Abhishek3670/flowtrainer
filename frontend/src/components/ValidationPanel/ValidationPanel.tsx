import React from 'react';
import ReactFlow, { MiniMap, Controls, Background, Node, Edge, useReactFlow } from 'reactflow';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import 'reactflow/dist/style.css';

interface ValidationError {
  nodeId: string;      // "workflow" for workflow-level errors, or node ID
  message: string;
  severity?: 'error' | 'warning' | 'info';
}

interface ValidationPanelProps {
  isOpen: boolean;
  errors: ValidationError[];
  nodes: Node[];
  edges: Edge[];
  onClose: () => void;
  onFocusNode: (nodeId: string) => void;
}

const severityIcon = {
  error: <AlertCircle className="w-5 h-5 text-red-600" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  info: <CheckCircle className="w-5 h-5 text-green-600" />,
};

export default function ValidationPanel({
  isOpen,
  onClose,
  errors,
  nodes,
  edges,
  onFocusNode,
}: ValidationPanelProps) {
  const hasErrors = errors.length > 0;

  return (
    <div
      className={`fixed top-16 right-0 h-[calc(100%-4rem)] w-96 bg-white dark:bg-gray-900 border-l border-gray-300 dark:border-gray-700 shadow-lg transform transition-transform duration-300 z-50
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-300 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {hasErrors ? 'Validation Issues' : 'Workflow Status'}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto h-full p-3">
        {hasErrors ? (
          errors.map((e, i) => (
            <div
              key={i}
              className="p-2 mb-2 rounded bg-red-50 dark:bg-red-900 cursor-pointer"
              onClick={() => e.nodeId !== 'workflow' && onFocusNode(e.nodeId)}
            >
              {e.message}
            </div>
          ))
        ) : (
          <div className="h-60 border border-gray-300 dark:border-gray-700 rounded">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              zoomOnScroll={false}
              panOnScroll={false}
              zoomOnPinch={false}
              panOnDrag={false}
              zoomOnDoubleClick={false}          
              attributionPosition="bottom-right"
            >
              <MiniMap />
              <Background />
            </ReactFlow>
          </div>
        )}
      </div>
    </div>
  );
}
