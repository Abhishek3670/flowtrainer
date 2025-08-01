import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { addComment } from '../store/slices/whiteboardSlice';
import { Comment } from '../types';

interface AddCommentProps {
  objectId: string;
  position: { x: number; y: number };
  onCancel: () => void;
}

const AddComment: React.FC<AddCommentProps> = ({ objectId, position, onCancel }) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;

    const newComment: Comment = {
      id: `comment_${Date.now()}`,
      objectId,
      author: user,
      text: text.trim(),
      position,
      createdAt: new Date().toISOString(),
      resolved: false,
      mentions: []
    };

    dispatch(addComment(newComment));
    setText('');
    onCancel();
  };

  return (
    <div className="add-comment absolute z-10 bg-white border rounded-lg shadow-lg p-3" 
         style={{ left: position.x, top: position.y }}>
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="w-64 h-20 p-2 border rounded-md resize-none text-sm"
          autoFocus
        />
        <div className="flex justify-end mt-2 space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!text.trim()}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            Add Comment
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddComment;
