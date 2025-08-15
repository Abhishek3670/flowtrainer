import React from 'react';

interface AutoSaveIndicatorProps {
  lastSaved: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  error: string | null;
  isEnabled: boolean;
  onManualSave?: () => void;
}

const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  lastSaved,
  isSaving,
  hasUnsavedChanges,
  error,
  isEnabled,
  onManualSave
}) => {
  const getStatus = () => {
    if (!isEnabled) {
      return {
        icon: '☁️',
        text: 'Auto-save disabled',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-500'
      };
    }
    
    if (isSaving) {
      return {
        icon: '🔄',
        text: 'Saving...',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-600'
      };
    }
    
    if (error) {
      return {
        icon: '❌',
        text: `Failed: ${error}`,
        bgColor: 'bg-red-100',
        textColor: 'text-red-600'
      };
    }
    
    if (hasUnsavedChanges) {
      return {
        icon: '⏳',
        text: 'Unsaved changes',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-600'
      };
    }
    
    if (lastSaved) {
      return {
        icon: '✅',
        text: `Saved ${formatTimeAgo(lastSaved)}`,
        bgColor: 'bg-green-100',
        textColor: 'text-green-600'
      };
    }
    
    return {
      icon: '💾',
      text: 'Not saved yet',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-500'
    };
  };

  const status = getStatus();

  const handleClick = () => {
    if (error && onManualSave) {
      onManualSave();
    }
  };

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-1 rounded-full shadow-sm border
        ${status.bgColor} ${status.textColor}
        ${error ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
      `}
      onClick={handleClick}
      title={status.text}
    >
      <span className="text-sm">{status.icon}</span>
      <span className="text-xs font-medium hidden sm:block">
        {status.text}
      </span>
    </div>
  );
};
