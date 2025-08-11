import React from 'react';
import { AlertCircle, X } from 'lucide-react';

// Debug utility function
const debugLog = (component: string, action: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${component}] ${action}`, data || '');
};

interface ValidationPanelProps {
  errors: { nodeId: string; message: string }[];
  onClose: () => void;
  onFocusNode: (nodeId: string) => void;
}

const ValidationPanel: React.FC<ValidationPanelProps> = ({ errors, onClose, onFocusNode }) => {
  debugLog('ValidationPanel', 'Component rendered', { 
    errorCount: errors.length,
    errors: errors.map(e => ({ nodeId: e.nodeId, message: e.message }))
  });

  const handleClose = () => {
    debugLog('ValidationPanel', 'Close button clicked');
    onClose();
  };

  const handleFocusNode = (nodeId: string) => {
    debugLog('ValidationPanel', 'Focus node clicked', { nodeId });
    onFocusNode(nodeId);
  };

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl p-4 z-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Validation Errors</h2>
        <button onClick={handleClose}><X /></button>
      </div>
      {errors.length === 0 ? (
        <p>No validation errors.</p>
      ) : (
        <ul className="space-y-2">
          {errors.map((err, i) => (
            <li key={i} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
                onClick={() => handleFocusNode(err.nodeId)}>
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>{err.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ValidationPanel;
