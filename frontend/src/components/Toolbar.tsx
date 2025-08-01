import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setTool, addObject, undo, redo, clearSelection } from '../store/slices/whiteboardSlice';
import { WhiteboardObjectType } from '../types';

const Toolbar: React.FC = () => {
  const dispatch = useDispatch();
  const { tool, selectedObjectIds } = useSelector((state: RootState) => state.whiteboard.canvas);
  const { undoStack, redoStack } = useSelector((state: RootState) => state.whiteboard);

const tools = [
    { 
      id: 'select', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      ), 
      label: 'Select', 
      shortcut: 'V',
      description: 'Select and move objects'
    },
    { 
      id: 'text', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      ), 
      label: 'Text', 
      shortcut: 'T',
      description: 'Add text boxes'
    }
  ];

  const handleToolSelect = (toolId: string) => {
    dispatch(setTool(toolId));
  };

  const createObject = (type: WhiteboardObjectType) => {
    const newObject = {
      id: `obj_${Date.now()}`,
      type,
      position: { x: 100, y: 100 },
      size: getDefaultSize(type),
      data: getDefaultData(type)
    };
    dispatch(addObject(newObject));
  };

  const getDefaultSize = (type: WhiteboardObjectType) => {
    switch (type) {
      case WhiteboardObjectType.STICKY_NOTE:
        return { width: 200, height: 150 };
      case WhiteboardObjectType.TEXT:
        return { width: 300, height: 50 };
      case WhiteboardObjectType.RECTANGLE:
      case WhiteboardObjectType.CIRCLE:
      case WhiteboardObjectType.TRIANGLE:
        return { width: 150, height: 150 };
      case WhiteboardObjectType.IMAGE:
        return { width: 300, height: 200 };
      default:
        return { width: 200, height: 100 };
    }
  };

  const getDefaultData = (type: WhiteboardObjectType) => {
    switch (type) {
      case WhiteboardObjectType.STICKY_NOTE:
        return { text: 'New sticky note', color: '#FFEB3B' };
      case WhiteboardObjectType.TEXT:
        return { text: 'Double-click to edit', fontSize: 16, color: '#000000' };
      case WhiteboardObjectType.RECTANGLE:
      case WhiteboardObjectType.CIRCLE:
      case WhiteboardObjectType.TRIANGLE:
        return { fillColor: '#E3F2FD', strokeColor: '#1976D2', strokeWidth: 2 };
      case WhiteboardObjectType.IMAGE:
        return { src: '', alt: 'Image placeholder' };
      default:
        return {};
    }
  };

  const handleCanvasClick = (toolId: string) => {
    // Only change tool, don't create objects immediately
    // Objects will be created when canvas is clicked
    return;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 w-64 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          FlowTrain
        </h2>
        
        {/* Action buttons */}
        <div className="flex space-x-1 mb-4">
          <button
            onClick={() => dispatch(undo())}
            disabled={undoStack.length === 0}
            className={`p-2 rounded-lg transition-all duration-200 ${
              undoStack.length === 0
                ? 'text-gray-400 cursor-not-allowed bg-gray-50 dark:bg-gray-800'
                : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm hover:shadow-md'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          
          <button
            onClick={() => dispatch(redo())}
            disabled={redoStack.length === 0}
            className={`p-2 rounded-lg transition-all duration-200 ${
              redoStack.length === 0
                ? 'text-gray-400 cursor-not-allowed bg-gray-50 dark:bg-gray-800'
                : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm hover:shadow-md'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tools */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
          Tools
        </h3>
        <div className="space-y-2">
          {tools.map((toolItem) => (
            <button
              key={toolItem.id}
              onClick={() => {
                handleToolSelect(toolItem.id);
                handleCanvasClick(toolItem.id);
              }}
              className={`w-full flex items-center p-3 rounded-xl text-left transition-all duration-200 border ${
                tool === toolItem.id
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-700 shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm'
              }`}
              title={`${toolItem.label} (${toolItem.shortcut}) - ${toolItem.description}`}
            >
              <div className={`p-2 rounded-lg mr-3 ${
                tool === toolItem.id
                  ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
                {toolItem.icon}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{toolItem.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {toolItem.description}
                </div>
                <div className={`text-xs mt-1 px-2 py-0.5 rounded-md inline-block ${
                  tool === toolItem.id
                    ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                  {toolItem.shortcut}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selection info */}
      {selectedObjectIds.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
            Selection
          </h3>
          <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            {selectedObjectIds.length} object(s) selected
          </div>
          <button
            onClick={() => dispatch(clearSelection())}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
};

export default Toolbar;
