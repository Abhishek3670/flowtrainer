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

// Add interface for props
interface HeaderProps {
  isSaving?: boolean;
  lastSaved?: Date | null;
  onSave?: () => void;
  workflowName?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  isSaving = false, 
  lastSaved = null, 
  onSave,
  workflowName = "Object Detection Pipeline"
}) => {
  const { theme, toggleTheme } = useTheme();

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
          <button className="btn btn-primary">
            <Play className="w-4 h-4 mr-2" />
            Run Pipeline
          </button>
          
          <button 
            className={`btn ${isSaving ? 'opacity-50 cursor-not-allowed' : ''} btn-secondary`}
            onClick={onSave}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          
          <button className="btn btn-secondary">
            <Share className="w-4 h-4 mr-2" />
            Share
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-2" />
          
          <button className="btn btn-outline">
            <Undo className="w-4 h-4" />
          </button>
          <button className="btn btn-outline">
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
        
        <button 
          onClick={toggleTheme}
          className="btn btn-outline p-2"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
        
        <div className="flex -space-x-2">
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm">DS</div>
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">ML</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
