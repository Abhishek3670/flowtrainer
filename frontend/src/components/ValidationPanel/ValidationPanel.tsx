import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ValidationPanelProps {
  errors: { nodeId: string; message: string }[];
  onClose: () => void;
  onFocusNode: (nodeId: string) => void;
}

const ValidationPanel: React.FC<ValidationPanelProps> = ({ errors, onClose, onFocusNode }) => (
  <div className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl p-4 z-50">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold">Validation Errors</h2>
      <button onClick={onClose}><X /></button>
    </div>
    {errors.length === 0 ? (
      <p>No validation errors.</p>
    ) : (
      <ul className="space-y-2">
        {errors.map((err, i) => (
          <li key={i} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
              onClick={() => onFocusNode(err.nodeId)}>
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span>{err.message}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default ValidationPanel;
