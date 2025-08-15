import React from 'react';

interface FreshStartPromptProps {
  onStartFresh: () => void;
  onShowExample?: () => void;
}

export const FreshStartPrompt: React.FC<FreshStartPromptProps> = ({ 
  onStartFresh, 
  onShowExample 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🚀</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to FlowTrainer!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          No previous work found. Start building your first workflow by dragging components from the left panel.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={onStartFresh}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
          >
            Start Building
          </button>
          
          {onShowExample && (
            <button
              onClick={onShowExample}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Load Example Workflow
            </button>
          )}
        </div>
        
        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          💡 Tip: Your work will be automatically saved as you build
        </div>
      </div>
    </div>
  );
};
