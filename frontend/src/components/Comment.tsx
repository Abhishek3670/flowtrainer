import React from 'react';
import { Comment as CommentType } from '../types';

interface CommentProps {
  comment: CommentType;
  onResolve: (commentId: string) => void;
}

const Comment: React.FC<CommentProps> = ({ comment, onResolve }) => {
  return (
    <div className="comment p-2 border rounded-md bg-white shadow-md">
      <div className="comment-header flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-800">{comment.author.email}</span>
        <button
          className="text-xs text-blue-500 hover:underline"
          onClick={() => onResolve(comment.id)}
          disabled={comment.resolved}
        >
          {comment.resolved ? 'Resolved' : 'Resolve'}
        </button>
      </div>
      <div className="comment-body mt-1">
        <p className="text-sm text-gray-600">{comment.text}</p>
      </div>
    </div>
  );
};

export default Comment;

