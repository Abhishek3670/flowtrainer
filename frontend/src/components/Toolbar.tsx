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
    <>
      {/* Floating left toolbar */}
      <div className="absolute left-4 top-16 z-50 flex flex-col gap-2">
        {/* Tools */}
        {tools.map((toolItem) => (
          <button
            key={toolItem.id}
            onClick={() => {
              handleToolSelect(toolItem.id);
              handleCanvasClick(toolItem.id);
            }}
            className={`w-12 h-12 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl border ${
              tool === toolItem.id
                ? 'bg-blue-500 text-white border-blue-600 scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            title={`${toolItem.label} (${toolItem.shortcut}) - ${toolItem.description}`}
          >
            {toolItem.icon}
          </button>
        ))}
        
        {/* Separator */}
        <div className="w-8 h-px bg-gray-300 dark:bg-gray-600 mx-auto my-2"></div>
        
        {/* Undo button */}
        <button
          onClick={() => dispatch(undo())}
          disabled={undoStack.length === 0}
          className={`w-12 h-12 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl border ${
            undoStack.length === 0
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed border-gray-200 dark:border-gray-700'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        
        {/* Redo button */}
        <button
          onClick={() => dispatch(redo())}
          disabled={redoStack.length === 0}
          className={`w-12 h-12 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl border ${
            redoStack.length === 0
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed border-gray-200 dark:border-gray-700'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
        </button>
      </div>
      
      {/* Selection info (floating) */}
      {selectedObjectIds.length > 0 && (
        <div className="absolute left-20 bottom-4 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-3">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {selectedObjectIds.length} selected
          </div>
          <button
            onClick={() => dispatch(clearSelection())}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear Selection
          </button>
        </div>
      )}
    </>
  );
};

export default Toolbar;
