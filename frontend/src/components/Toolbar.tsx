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
    { id: 'select', icon: '↖️', label: 'Select', shortcut: 'V' },
    { id: 'text', icon: '📄', label: 'Text', shortcut: 'T' }
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
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => dispatch(undo())}
            disabled={undoStack.length === 0}
            className={`p-2 rounded-md ${
              undoStack.length === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Undo (Ctrl+Z)"
          >
            ↶
          </button>
          
          <button
            onClick={() => dispatch(redo())}
            disabled={redoStack.length === 0}
            className={`p-2 rounded-md ${
              redoStack.length === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Redo (Ctrl+Y)"
          >
            ↷
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
              className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${
                tool === toolItem.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={`${toolItem.label} (${toolItem.shortcut})`}
            >
              <span className="text-lg mr-3">{toolItem.icon}</span>
              <div>
                <div className="font-medium">{toolItem.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
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
