import React from 'react';
import {
  Save,
  Share,
  Undo,
  Redo,
  Brain,
  ChevronRight,
  Sun,
  Moon,
  Play,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

// Debug utility function
const debugLog = (component: string, action: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${component}] ${action}`, data || '');
};

// Update interface for props
interface HeaderProps {
  isSaving?: boolean;
  lastSaved?: Date | null;
  onRun: () => void;
  onSave?: () => void;
  workflowName?: string;

  autoSaveEnabled: boolean;          // <-- add this
  onToggleAutoSave: () => void;      // <-- add this
}

const Header: React.FC<HeaderProps> = ({
  isSaving = false,
  lastSaved = null,
  onSave,
  onRun,
  workflowName = "Object Detection Pipeline",
  autoSaveEnabled,
  onToggleAutoSave
}) => {
  debugLog('Header', 'Component rendered', { 
    isSaving, 
    lastSaved: lastSaved?.toISOString(), 
    workflowName,
    autoSaveEnabled 
  });
  
  const { theme, toggleTheme } = useTheme();

  const handleRunClick = () => {
    debugLog('Header', 'Run pipeline button clicked');
    onRun();
  };

  const handleSaveClick = () => {
    debugLog('Header', 'Save button clicked', { isSaving });
    if (onSave && !isSaving) {
      onSave();
    }
  };

  const handleShareClick = () => {
    debugLog('Header', 'Share button clicked');
    // TODO: Implement share functionality
  };

  const handleUndoClick = () => {
    debugLog('Header', 'Undo button clicked');
    // TODO: Implement undo functionality
  };

  const handleRedoClick = () => {
    debugLog('Header', 'Redo button clicked');
    // TODO: Implement redo functionality
  };

  const handleAutoSaveToggle = () => {
    debugLog('Header', 'Auto-save toggle clicked', { currentState: autoSaveEnabled });
    onToggleAutoSave();
  };

  const handleThemeToggle = () => {
    debugLog('Header', 'Theme toggle clicked', { currentTheme: theme });
    toggleTheme();
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-8 h-8 text-purple-600" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">FlowCraft</span>
          <span className="text-sm text-gray-500 bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">ML</span>
        </div>

        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <span>Workspace</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 dark:text-white">{workflowName}</span>
        </nav>
      </div>

      {/* Center Section */}
      <div className="flex-1 flex justify-center">
        <div className="flex items-center space-x-2">
            <button className="btn btn-primary" onClick={handleRunClick}>
            <Play className="w-4 h-4 mr-2" />
            Run Pipeline
          </button>

          <button
            className={`btn ${isSaving ? 'opacity-50 cursor-not-allowed' : ''} btn-secondary`}
            onClick={handleSaveClick}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>

          <button className="btn btn-secondary" onClick={handleShareClick}>
            <Share className="w-4 h-4 mr-2" />
            Share
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          <button className="btn btn-outline" onClick={handleUndoClick}>
            <Undo className="w-4 h-4" />
          </button>
          <button className="btn btn-outline" onClick={handleRedoClick}>
            <Redo className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        {/* Save Status */}
        {lastSaved && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Saved at {lastSaved.toLocaleTimeString()}
          </div>
        )}

        {/* Pipeline Status */}
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600 dark:text-gray-300">Ready</span>
        </div>

        {/* Auto-save Toggle */}
        <button
          onClick={handleAutoSaveToggle}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            autoSaveEnabled
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {autoSaveEnabled ? 'Auto-save ON' : 'Auto-save OFF'}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={handleThemeToggle}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
