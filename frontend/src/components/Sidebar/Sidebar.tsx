import React, { useState } from 'react';
import { 
  Play, 
  Clock, 
  Globe, 
  Mail, 
  Database,
  GitBranch,
  ChevronLeft,
  Search,
  Webhook,
  Repeat,
  Hash,
  Timer
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const nodeLibrary = [
  {
    category: 'Triggers',
    nodes: [
      { id: 'start', icon: Play, title: 'Start', description: 'Begin workflow execution', color: 'bg-green-500' },
      { id: 'timer', icon: Clock, title: 'Timer', description: 'Schedule workflow runs', color: 'bg-green-500' },
      { id: 'webhook', icon: Webhook, title: 'Webhook', description: 'HTTP trigger endpoint', color: 'bg-green-500' },
    ]
  },
  {
    category: 'Actions',
    nodes: [
      { id: 'http', icon: Globe, title: 'HTTP Request', description: 'Make API calls', color: 'bg-blue-500' },
      { id: 'email', icon: Mail, title: 'Send Email', description: 'Send notifications', color: 'bg-red-500' },
      { id: 'database', icon: Database, title: 'Database Query', description: 'Query database', color: 'bg-blue-500' },
    ]
  },
  {
    category: 'Logic',
    nodes: [
      { id: 'condition', icon: GitBranch, title: 'Condition', description: 'Branch workflow logic', color: 'bg-yellow-500' },
      { id: 'loop', icon: Repeat, title: 'Loop', description: 'Repeat actions', color: 'bg-yellow-500' },
    ]
  },
  {
    category: 'Utilities',
    nodes: [
      { id: 'delay', icon: Timer, title: 'Delay', description: 'Wait before next step', color: 'bg-purple-500' },
      { id: 'transform', icon: Hash, title: 'Transform', description: 'Transform data', color: 'bg-purple-500' },
    ]
  }
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  if (collapsed) {
    return (
      <div className="w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4">
        <button 
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tools</h2>
          <button 
            onClick={onToggle}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Node Library */}
      <div className="flex-1 overflow-y-auto p-4">
        {nodeLibrary.map((category) => (
          <div key={category.category} className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
              {category.category}
            </h3>
            
            <div className="space-y-2">
              {category.nodes.map((node) => {
                const Icon = node.icon;
                return (
                  <div
                    key={node.id}
                    draggable
                    onDragStart={(event) => onDragStart(event, node.id)}
                    className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-move transition-colors"
                  >
                    <div className={`w-10 h-10 ${node.color} rounded-lg flex items-center justify-center mr-3`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {node.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {node.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
