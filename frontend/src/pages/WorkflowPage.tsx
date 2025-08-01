import React from 'react';
import Toolbar from '../components/Toolbar';
import Canvas from '../components/Canvas';

const WorkflowPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen">
<Toolbar />

<Canvas />

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
