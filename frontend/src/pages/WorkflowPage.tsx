import React from 'react';
import Toolbar from '../components/Toolbar';
import Canvas from '../components/Canvas';

const WorkflowPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      {/* Floating toolbar */}
      <Toolbar />

      {/* Floating title */}
      <div className="absolute top-4 left-4 z-50">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          FlowTrain
        </h1>
      </div>


      {/* Main canvas */}
      <div className="flex justify-center items-center h-screen">
        <Canvas />
      </div>
    </div>
  );
};

export default WorkflowPage;
