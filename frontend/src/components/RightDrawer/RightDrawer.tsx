import React from 'react';
import { X } from 'lucide-react';
import PropertiesPanel from '../PropertiesPanel/PropertiesPanel';
import ValidationPanel from '../ValidationPanel/ValidationPanel';

interface RightDrawerProps {
  isOpen: boolean;
  activeTab: 'properties' | 'validation';
  onTabChange: (tab: 'properties' | 'validation') => void;
  onClose: () => void;

  selectedNode: any;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNodeUpdate: (nodeId: string, newData: any) => void;

  validationErrors: any[];
  nodes: any[];
  edges: any[];
  onFocusNode: (id: string) => void;
}

export default function RightDrawer({
  isOpen,
  activeTab,
  onTabChange,
  onClose,
  selectedNode,
  collapsed,
  onToggleCollapse,
  onNodeUpdate,
  validationErrors,
  nodes,
  edges,
  onFocusNode,
}: RightDrawerProps) {
  return (
    <div
      className={`fixed top-16 right-0 h-[calc(100%-4rem)] w-96 
        bg-white dark:bg-gray-900 border-l border-gray-300 dark:border-gray-700 
        transform transition-transform duration-300 z-50 flex flex-col
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      {/* Drawer Header with Tabs */}
      <div className="flex items-center justify-between p-3 border-b border-gray-300 dark:border-gray-700">
        <div className="flex space-x-2">
          <button
            onClick={() => onTabChange('properties')}
            className={`px-3 py-1 rounded ${
              activeTab === 'properties'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200'
            }`}
          >
            Properties
          </button>
          <button
            onClick={() => onTabChange('validation')}
            className={`px-3 py-1 rounded ${
              activeTab === 'validation'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200'
            }`}
          >
            Validation
          </button>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-900 dark:hover:text-white"
          aria-label="Close Drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'properties' ? (
          <PropertiesPanel
            selectedNode={selectedNode}
            collapsed={collapsed}
            onToggle={onToggleCollapse}
            onNodeUpdate={onNodeUpdate}
            isOpen={true}
            onClose={onClose}
          />
        ) : (
          <ValidationPanel
            isOpen={true}
            onClose={onClose}
            errors={validationErrors}
            nodes={nodes}
            edges={edges}
            onFocusNode={onFocusNode}
          />
        )}
      </div>
    </div>
  );
}
