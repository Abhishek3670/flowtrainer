import React, { useEffect, useState } from 'react';
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
  Activity,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import SystemDashboard from '../SystemDashboard/SystemDashboard';

interface HeaderProps {
  isSaving: boolean;
  lastSaved: Date | null;
  onSave: () => void;
  workflowName?: string;
  autoSaveEnabled: boolean;
  onToggleAutoSave: () => void;
  onRun: () => void;
  disableRun?: boolean;
  // Undo/Redo props
  onUndo: () => void;
  onRedo: () => void;
  disableUndo: boolean;
  disableRedo: boolean;
  // Checkpoint props
  onOpenCheckpointModal: () => void;
}

const Header: React.FC<HeaderProps> = ({
  isSaving,
  lastSaved,
  onSave,
  workflowName = 'Object Detection Pipeline',
  autoSaveEnabled,
  onToggleAutoSave,
  onRun,
  disableRun = false,
  onUndo,
  onRedo,
  disableUndo,
  disableRedo,
  onOpenCheckpointModal,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { systemStatus } = useSystemStatus();
  const [showSystemDashboard, setShowSystemDashboard] = useState(false);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (!disableUndo) {
          onUndo();
        }
      }
      // Ctrl+Shift+Z, Cmd+Shift+Z, or Ctrl+Y for redo
      else if (
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'z') ||
        (event.ctrlKey && event.key.toLowerCase() === 'y')
      ) {
        event.preventDefault();
        if (!disableRedo) {
          onRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo, disableUndo, disableRedo]);

  // Determine system status color and message
  const getSystemStatusInfo = () => {
    if (!systemStatus) {
      return {
        color: 'gray',
        message: 'Unknown',
        indicator: 'bg-gray-400'
      };
    }

    const { capacity_utilization } = systemStatus;
    
    if (capacity_utilization && capacity_utilization >= 100) {
      return {
        color: 'red',
        message: 'At Capacity',
        indicator: 'bg-red-500'
      };
    } else if (capacity_utilization && capacity_utilization >= 80) {
      return {
        color: 'yellow',
        message: 'High Load',
        indicator: 'bg-yellow-500'
      };
    } else if (capacity_utilization && capacity_utilization > 0) {
      return {
        color: 'green',
        message: 'Normal',
        indicator: 'bg-green-500'
      };
    } else {
      return {
        color: 'blue',
        message: 'Idle',
        indicator: 'bg-blue-500'
      };
    }
  };

  const systemStatusInfo = getSystemStatusInfo();

  return (
    <>
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
            {/* Enhanced Run Button with Queue Info */}
            <button
              onClick={onRun}
              disabled={disableRun}
              className={`flex items-center px-4 py-2 rounded transition-colors ${
                disableRun
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : systemStatus?.capacity_utilization && systemStatus.capacity_utilization >= 100
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              title={
                disableRun 
                  ? 'Add at least one node to run pipeline' 
                  : systemStatus?.capacity_utilization && systemStatus.capacity_utilization >= 100
                  ? 'Pipeline will be queued (system at capacity)'
                  : 'Run Pipeline'
              }
            >
              <Play className="w-4 h-4 mr-2" />
              {systemStatus?.capacity_utilization && systemStatus.capacity_utilization >= 100 ? 'Queue' : 'Run'}
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

            {/* Undo/Redo buttons */}
            <button
              onClick={onUndo}
              disabled={disableUndo}
              className={`btn btn-outline ${
                disableUndo
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={disableUndo ? 'Nothing to undo' : 'Undo (Ctrl+Z)'}
              aria-label="Undo last action"
            >
              <Undo className="w-4 h-4" />
            </button>

            <button
              onClick={onRedo}
              disabled={disableRedo}
              className={`btn btn-outline ${
                disableRedo
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={disableRedo ? 'Nothing to redo' : 'Redo (Ctrl+Shift+Z)'}
              aria-label="Redo last undone action"
            >
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

          {/* System Status with Dashboard Button */}
          <button
            onClick={() => setShowSystemDashboard(true)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
              systemStatusInfo.color === 'red'
                ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300'
                : systemStatusInfo.color === 'yellow'
                ? 'border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300'
                : systemStatusInfo.color === 'green'
                ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300'
                : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300'
            }`}
            title="Click to view system dashboard"
          >
            <div className={`w-2 h-2 rounded-full ${systemStatusInfo.indicator}`} />
            <Activity className="w-4 h-4" />
            <span className="text-sm font-medium">{systemStatusInfo.message}</span>
            {systemStatus && (
              <span className="text-xs">
                {systemStatus.running_executions}/{systemStatus.max_concurrent_executions}
              </span>
            )}
            {systemStatus?.queued_executions && systemStatus.queued_executions > 0 && (
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
                {systemStatus.queued_executions} queued
              </span>
            )}
          </button>
          
          {/* Create Checkpoint button */}
          <button 
            onClick={onOpenCheckpointModal} 
            className="btn btn-primary" 
            title="Create Checkpoint"
          >
            <Save className="w-4 h-4 mr-2" /> 
            Checkpoint
          </button>

          {/* Auto-save toggle */}
          <div className="flex items-center space-x-2 cursor-pointer select-none text-gray-700 dark:text-gray-300">
            <span className="text-sm">Auto-save</span>
            <button
              onClick={onToggleAutoSave}
              aria-pressed={autoSaveEnabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                autoSaveEnabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoSaveEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <button
            onClick={toggleTheme}
            className="btn btn-outline p-2"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>

          <div className="flex -space-x-2">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm">DS</div>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">ML</div>
          </div>
        </div>
      </header>

      {/* System Dashboard Modal */}
      <SystemDashboard
        isOpen={showSystemDashboard}
        onClose={() => setShowSystemDashboard(false)}
      />
    </>
  );
};

export default Header;
