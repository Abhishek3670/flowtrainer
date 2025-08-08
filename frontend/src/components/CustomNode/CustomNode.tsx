import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { X } from 'lucide-react';

interface CustomNodeData {
  label: string;
  onDelete?: (nodeId: string) => void;
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ id, data, selected }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onDelete) {
      data.onDelete(id);
    }
  };

  return (
    <div 
      className={`
        relative px-4 py-2 shadow-lg rounded-lg bg-white dark:bg-gray-800 
        border-2 min-w-[120px] text-center
        ${selected 
          ? 'border-blue-500 shadow-blue-500/25' 
          : 'border-gray-200 dark:border-gray-600'
        }
        transition-all duration-200 hover:shadow-xl
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Delete button - smaller size, only visible on hover */}
      {isHovered && (
        <button
          onClick={handleDelete}
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors z-10"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 border-2 border-gray-400 bg-white"
        style={{ left: -6 }}
      />
      
      {/* Node Content */}
      <div className="text-sm font-medium text-gray-900 dark:text-white">
        {data.label}
      </div>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 border-2 border-gray-400 bg-white"
        style={{ right: -6 }}
      />
    </div>
  );
};

export default CustomNode;
