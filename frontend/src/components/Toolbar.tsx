import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setTool, addObject } from '../store/slices/whiteboardSlice';
import { WhiteboardObjectType, ProcessStep } from '../types';

const Toolbar: React.FC = () => {
  const dispatch = useDispatch();
  const { tool } = useSelector((state: RootState) => state.whiteboard.canvas);

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

  const dataBlocks = [
    {
      id: 'data_pipeline',
      type: WhiteboardObjectType.DATA_PIPELINE,
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"/>
        </svg>
      ),
      label: 'Data Fetch',
      color: '#4F46E5',
      description: 'Create a data processing pipeline'
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
      case WhiteboardObjectType.DATA_PIPELINE:
        return { width: 320, height: 180 };
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
      case WhiteboardObjectType.DATA_PIPELINE:
        return {
          title: 'Data Fetch',
          description: 'Fetch and process data from various sources',
          steps: [
            {
              id: ProcessStep.SOURCE,
              label: 'Source',
              status: 'idle' as const,
              progress: 0
            },
            {
              id: ProcessStep.EXTRACTION,
              label: 'Extraction',
              status: 'idle' as const,
              progress: 0
            },
            {
              id: ProcessStep.OUTPUT,
              label: 'Output',
              status: 'idle' as const,
              progress: 0
            }
          ],
          isRunning: false,
          currentStep: undefined,
          results: {},
          config: {
            source: {
              type: 'file' as const,
              path: '',
              connection: {}
            },
            extraction: {
              method: 'sampling' as const,
              parameters: {}
            },
            output: {
              format: 'json' as const,
              destination: ''
            }
          }
        };
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
      {/* Tools Panel */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50">
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-3">
          {/* Panel Header */}
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3 text-center">
            Tools
          </div>
          
          {/* Tools Grid - Vertical Layout */}
          <div className="flex flex-col gap-2">
            {/* Main Tools - Vertical Stack */}
            {tools.map((toolItem) => (
              <button
                key={toolItem.id}
                onClick={() => {
                  handleToolSelect(toolItem.id);
                  handleCanvasClick(toolItem.id);
                }}
                className={`w-10 h-10 rounded-lg transition-all duration-200 flex items-center justify-center border ${
                  tool === toolItem.id
                    ? 'bg-blue-500 text-white border-blue-600 shadow-md scale-105'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 hover:scale-105'
                }`}
                title={`${toolItem.label} (${toolItem.shortcut})`}
              >
                <div className="w-4 h-4">
                  {toolItem.icon}
                </div>
              </button>
            ))}
            
            {/* Blocks Separator */}
            <div className="w-full h-px bg-gray-300 dark:bg-gray-600 my-2"></div>
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide text-center mb-2">
              Blocks
            </div>
            
            {/* Data Blocks */}
            {dataBlocks.map((block) => (
              <button
                key={block.id}
                onClick={() => createObject(block.type)}
                className="w-10 h-10 rounded-lg transition-all duration-200 flex items-center justify-center border bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 hover:scale-105"
                title={block.description}
                style={{
                  backgroundColor: `${block.color}20`,
                  borderColor: `${block.color}40`
                }}
              >
                <div className="w-4 h-4">
                  {block.icon}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Toolbar;
