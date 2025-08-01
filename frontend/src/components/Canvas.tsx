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


  return (
    <div
      ref={canvasRef}
      className="canvas-container"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        cursor: 'grab',
      }}
      onMouseDown={handleMouseDown}
      onClick={handleCanvasClick}
    >
      <div
        className="canvas-content"
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: '0 0',
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
              borderRadius: '8px',
              backgroundColor: obj.type === WhiteboardObjectType.TEXT ? '#F8FAFC' : obj.data.color,
              boxShadow: obj.type === WhiteboardObjectType.TEXT ? (obj.selected ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)') : 'none',
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

      <button
        onClick={() => setAddingComment(true)}
        style={{ position: 'absolute', top: 10, left: 10 }}
      >
        Add Comment
      </button>
    </div>
  );
};

export default Canvas;
