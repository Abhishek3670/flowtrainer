import React from 'react';
import { 
  Save, 
  Share, 
  Download, 
  Undo, 
  Redo, 
  Workflow,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Workflow className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">FlowCraft</span>
        </div>
        
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <span>Workspace</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 dark:text-white">API Integration Flow</span>
        </nav>
      </div>

      {/* Center Section */}
      <div className="flex-1 flex justify-center">
        <div className="flex items-center space-x-2">
          <button className="btn btn-primary">
            <Save className="w-4 h-4 mr-2" />
            Save
          </button>
          <button className="btn btn-secondary">
            <Share className="w-4 h-4 mr-2" />
            Share
          </button>
          <button className="btn btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            Export
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
        <button 
          onClick={toggleTheme}
          className="btn btn-outline p-2"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
        
        <div className="flex -space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">A</div>
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">S</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
