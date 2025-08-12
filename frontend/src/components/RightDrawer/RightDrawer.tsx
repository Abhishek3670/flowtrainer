import { useState } from 'react';
import { X } from 'lucide-react';
import { FileCog, ClipboardCheck } from 'lucide-react';
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
  // Local state for hover label
  const [hoveredTab, setHoveredTab] = useState<'properties' | 'validation' | null>(null);

  // Helper for showing label on hover
  const showLabel = (tab: 'properties' | 'validation') => hoveredTab === tab;

  return (
    <div
      className={`fixed top-16 right-0 h-[calc(100%-4rem)] 
        bg-white dark:bg-gray-900 border-l border-gray-300 dark:border-gray-700 
        transform transition-transform duration-300 z-50 flex flex-row
        ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%-2.5rem)]'}`}
      style={{ width: '24rem' }} // 96 tailwind = 24rem, main drawer width excluding toggles
    >
      {/* Main drawer content container */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-300 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{
            activeTab === 'properties' ? 'Properties' : 'Validation'
          }</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            aria-label="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Panel content */}
        <div className="flex-1 p-2 min-w-0">
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

      {/* Vertical toggles container */}
      <div
        className="relative flex flex-col w-10 bg-transparent"
        style={{ marginLeft: '-2.5rem' }} // Allow toggles to hang outside drawer by 2.5rem = 40px
        aria-label="Tab toggles"
      >
        {/* Properties toggle */}
        <button
          type="button"
          aria-pressed={activeTab === 'properties'}
          aria-label="Show Properties Panel"
          onClick={() => onTabChange('properties')}
          onMouseEnter={() => setHoveredTab('properties')}
          onMouseLeave={() => setHoveredTab(null)}
          className={`
            relative flex items-center justify-center w-10 h-24 
            rounded-l-full rounded-r-none
            ${activeTab === 'properties'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
            }
            cursor-pointer select-none
            focus:outline-none focus:ring-2 focus:ring-green-600
            transition-colors
          `}
          style={{
            clipPath: 'polygon(0 0, 70% 0, 100% 50%, 70% 100%, 0 100%)'
          }}
        >
          <FileCog className="w-6 h-6" />
          {showLabel('properties') && (
            <div
              className="absolute right-full pr-2 bg-black bg-opacity-70 text-white text-xs whitespace-nowrap rounded px-2 py-1 select-none pointer-events-none top-1/2 -translate-y-1/2 z-50"
              style={{ userSelect: 'none' }}
            >
              Properties
            </div>
          )}
        </button>

        {/* Validation toggle */}
        <button
          type="button"
          aria-pressed={activeTab === 'validation'}
          aria-label="Show Validation Panel"
          onClick={() => onTabChange('validation')}
          onMouseEnter={() => setHoveredTab('validation')}
          onMouseLeave={() => setHoveredTab(null)}
          className={`
            relative flex items-center justify-center w-10 h-24 mt-px
            rounded-l-full rounded-r-none
            ${activeTab === 'validation'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
            }
            cursor-pointer select-none
            focus:outline-none focus:ring-2 focus:ring-green-600
            transition-colors
          `}
          style={{
            clipPath: 'polygon(0 0, 70% 0, 100% 50%, 70% 100%, 0 100%)'
          }}
        >
          <ClipboardCheck className="w-6 h-6" />
          {showLabel('validation') && (
            <div
              className="absolute right-full pr-2 bg-black bg-opacity-70 text-white text-xs whitespace-nowrap rounded px-2 py-1 select-none pointer-events-none top-1/2 -translate-y-1/2 z-50"
              style={{ userSelect: 'none' }}
            >
              Validation
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
