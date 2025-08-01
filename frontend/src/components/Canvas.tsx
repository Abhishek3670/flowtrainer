import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setPan, setZoom, addObject, updateComment, updateObject, removeObject, selectObject, clearSelection } from '../store/slices/whiteboardSlice';
import { WhiteboardObjectType } from '../types';
import Comment from './Comment';
import AddComment from './AddComment';

const Canvas: React.FC = () => {
  const dispatch = useDispatch();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [addingComment, setAddingComment] = useState(false);
  const [commentPosition, setCommentPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{ id: string; offset: { x: number; y: number } } | null>(null);
  const [justDragged, setJustDragged] = useState(false);

  const { zoom, pan, objects, tool } = useSelector((state: RootState) => state.whiteboard.canvas);
  const comments = useSelector((state: RootState) => state.whiteboard.comments);

  const handleMouseMove = (e: MouseEvent) => {
    if (dragging) {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (canvasRect) {
        const newX = (e.clientX - canvasRect.left - pan.x) / zoom - dragging.offset.x;
        const newY = (e.clientY - canvasRect.top - pan.y) / zoom - dragging.offset.y;
        
        const objToUpdate = objects.find(obj => obj.id === dragging.id);
        if (objToUpdate) {
          dispatch(updateObject({
            ...objToUpdate,
            position: { x: newX, y: newY }
          }));
        }
      }
    }
  };

  const handleMouseUp = () => {
    if (dragging) {
      setDragging(null);
      setJustDragged(true);
      // Reset the flag after a short delay to allow normal clicking
      setTimeout(() => setJustDragged(false), 50);
    }
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      dispatch(setZoom(zoom + delta));
    };

    const canvasElement = canvasRef.current;
    if (canvasElement) {
      canvasElement.addEventListener('wheel', handleWheel);
    }

    return () => {
      if (canvasElement) {
        canvasElement.removeEventListener('wheel', handleWheel);
      }
    };
  }, [dispatch, zoom]);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, handleMouseMove, handleMouseUp]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    console.log('Canvas clicked!', { tool, justDragged }); // Debug log
    
    if (addingComment) {
      setCommentPosition({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }
    
    if (justDragged) {
      setJustDragged(false);
      return;
    }

    // Create new text box when text tool is selected and canvas is clicked
    if (tool === 'text') {
      const rect = e.currentTarget.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left - pan.x) / zoom;
      const canvasY = (e.clientY - rect.top - pan.y) / zoom;
      
      const newTextBox = {
        id: `text_${Date.now()}`,
        type: WhiteboardObjectType.TEXT,
        position: { x: canvasX, y: canvasY },
        size: { width: 300, height: 100 },
        data: { text: 'Click to edit text...', fontSize: 16, color: '#000000' },
        zIndex: objects.length + 10
      };
      dispatch(addObject(newTextBox));
      // Text tool stays active - don't auto-switch to select
    } else {
      // Clear selection when clicking on empty canvas (not in text mode)
      console.log('Clearing selection!'); // Debug log
      dispatch(clearSelection());
    }
  };


  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent creating text boxes when dragging to pan
    if (tool === 'text' || dragging) {
      return;
    }

    // Start panning
    const startX = e.pageX - pan.x;
    const startY = e.pageY - pan.y;
    let hasMoved = false;
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      hasMoved = true;
      dispatch(setPan({ x: moveEvent.pageX - startX, y: moveEvent.pageY - startY }));
    };

    const onMouseUp = () => {
      // End panning
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      
      // If the mouse moved, prevent click events from firing
      if (hasMoved) {
        setJustDragged(true);
        setTimeout(() => setJustDragged(false), 100);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };


  // Generate grid pattern for background
  const gridSize = 20;
  const gridOpacity = 0.1;
  
  return (
    <div
      ref={canvasRef}
      className="canvas-container"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        cursor: tool === 'text' ? 'crosshair' : (dragging ? 'grabbing' : 'grab'),
        background: '#f8fafc',
        backgroundImage: `
          radial-gradient(circle at ${gridSize}px ${gridSize}px, rgba(71, 85, 105, ${gridOpacity}) 1px, transparent 0),
          radial-gradient(circle at 0px 0px, rgba(71, 85, 105, ${gridOpacity * 0.5}) 1px, transparent 0)
        `,
        backgroundSize: `${gridSize}px ${gridSize}px`,
        backgroundPosition: `${pan.x % gridSize}px ${pan.y % gridSize}px, ${(pan.x % gridSize) - gridSize}px ${(pan.y % gridSize) - gridSize}px`,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleCanvasClick}
    >
      {/* Grid overlay for better depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(rgba(71, 85, 105, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(71, 85, 105, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize * 4}px ${gridSize * 4}px`,
          backgroundPosition: `${(pan.x % (gridSize * 4))}px ${(pan.y % (gridSize * 4))}px`,
        }}
      />
      
      <div
        className="canvas-content"
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
        }}
      >
        {objects.map((obj, index) => (
          <div
            key={obj.id}
            onClick={(e) => {
              e.stopPropagation();
              if (tool !== 'text') {
                dispatch(selectObject(obj.id));
              }
            }}
            style={{
              position: 'absolute',
              top: obj.position.y,
              left: obj.position.x,
              width: obj.size.width,
              height: obj.size.height,
              border: obj.type === WhiteboardObjectType.TEXT ? (obj.selected ? '2px solid #3B82F6' : '2px solid #E5E7EB') : 'none',
              borderRadius: '12px',
              backgroundColor: obj.type === WhiteboardObjectType.TEXT ? 'rgba(255, 255, 255, 0.95)' : obj.data.color,
              boxShadow: obj.type === WhiteboardObjectType.TEXT ? 
                (obj.selected ? 
                  '0 8px 25px rgba(59, 130, 246, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)' : 
                  '0 4px 15px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)'
                ) : 'none',
              backdropFilter: obj.type === WhiteboardObjectType.TEXT ? 'blur(10px)' : 'none',
              transition: 'all 0.2s ease-in-out',
              zIndex: obj.zIndex || index + 1, // Use zIndex from object or fallback to array index
              cursor: tool === 'text' ? 'text' : 'pointer',
            }}
          >
            {obj.type === WhiteboardObjectType.TEXT && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(removeObject(obj.id));
                  }}
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#EF4444',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: (obj.zIndex || index + 1) + 1
                  }}
                  title="Delete text box"
                >
                  ×
                </button>
                <button
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const canvasRect = canvasRef.current?.getBoundingClientRect();
                    if (canvasRect) {
                      setDragging({
                        id: obj.id,
                        offset: {
                          x: (e.clientX - canvasRect.left) / zoom - obj.position.x,
                          y: (e.clientY - canvasRect.top) / zoom - obj.position.y,
                        },
                      });
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '-10px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    color: 'white',
                    border: 'none',
                    cursor: 'grab',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: (obj.zIndex || index + 1) + 1
                  }}
                  title="Move text box"
                >
                  ⟡
                </button>
                <textarea
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    resize: 'none',
                    padding: '12px',
                    backgroundColor: 'transparent',
                    outline: 'none',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    borderRadius: '6px'
                  }}
                  value={obj.data.text}
                  onChange={(e) => dispatch(updateObject({ ...obj, data: { ...obj.data, text: e.target.value } }))}
                  onClick={(e) => e.stopPropagation()}
                />
              </>
            )}
          </div>
        ))}
        {comments.map((comment) => (
          <Comment
            key={comment.id}
            comment={comment}
            onResolve={(id) => dispatch(updateComment({ ...comment, resolved: true }))}
          />
        ))}
        {addingComment && (
          <AddComment
            objectId={''} // should be set to the related object
            position={commentPosition}
            onCancel={() => setAddingComment(false)}
          />
        )}
      </div>

      {/* Canvas Controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-50">
        <button
          onClick={() => setAddingComment(true)}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          title="Add Comment"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Comment
        </button>
      </div>
      
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-1 z-50">
        <button
          onClick={() => dispatch(setZoom(Math.min(zoom + 0.1, 3)))}
          className="w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          title="Zoom In"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        
        <div className="w-10 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
          {Math.round(zoom * 100)}%
        </div>
        
        <button
          onClick={() => dispatch(setZoom(Math.max(zoom - 0.1, 0.1)))}
          className="w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          title="Zoom Out"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        
        <button
          onClick={() => {
            dispatch(setZoom(1));
            dispatch(setPan({ x: 0, y: 0 }));
          }}
          className="w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          title="Reset View"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      {/* Canvas Info */}
      <div className="absolute bottom-4 left-4 z-50">
        <div className="px-3 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-md text-xs text-gray-600 dark:text-gray-400">
          <div>Pan: {Math.round(pan.x)}, {Math.round(pan.y)}</div>
          <div>Zoom: {Math.round(zoom * 100)}%</div>
          <div>Objects: {objects.length}</div>
        </div>
      </div>
    </div>
  );
};

export default Canvas;
