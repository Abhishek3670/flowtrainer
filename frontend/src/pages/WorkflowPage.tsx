import React from 'react';

const WorkflowPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen">
        {/* Left Toolbox */}
        <div className="w-64 node-toolbox">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              FlowCraft
            </h2>
            <div className="space-y-2">
              <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                <div className="text-sm font-medium text-primary-900 dark:text-primary-100">
                  🚀 Start Node
                </div>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  🌐 HTTP Call
                </div>
              </div>
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <div className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  ⏱️ Delay
                </div>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  🔀 Condition
                </div>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <div className="text-sm font-medium text-green-900 dark:text-green-100">
                  🔄 Loop
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 relative">
          <div className="toolbar p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                My Workflow
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <button className="btn-secondary">
                Save
              </button>
              <button className="btn-primary">
                Run
              </button>
            </div>
          </div>
          
          <div className="workflow-canvas bg-gray-100 dark:bg-gray-800 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🎨</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome to FlowCraft
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Drag nodes from the left panel to start building your workflow
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-500">
                  This is a demo interface. The full React Flow integration will be implemented next.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Properties Panel */}
        <div className="w-80 properties-panel">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Properties
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Select a node to edit its properties
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowPage;
