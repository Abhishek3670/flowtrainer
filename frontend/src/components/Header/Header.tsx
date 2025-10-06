/**
 * Header Component
 * 
 * Main application header that provides navigation, workflow controls,
 * and system status information. Includes save/load functionality,
 * undo/redo controls, workflow execution, and theme switching.
 * 
 * Key Features:
 * - Workflow save and checkpoint management
 * - Undo/redo with keyboard shortcuts (Ctrl+Z, Ctrl+Y)
 * - Workflow execution controls
 * - Auto-save toggle
 * - Theme switching (light/dark mode)
 * - System status monitoring
 * - Keyboard shortcut support
 * - User profile and logout
 * 
 * Keyboard Shortcuts:
 * - Ctrl+Z / Cmd+Z: Undo
 * - Ctrl+Y / Cmd+Shift+Z: Redo
 */

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
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthContext } from '../../hooks/useAuthContext';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import SystemDashboard from '../SystemDashboard/SystemDashboard';
import { useNavigate } from 'react-router-dom';

/**
 * Header component props interface
 * Defines all the callbacks and state values needed for header functionality
 */
interface HeaderProps {
  // Workflow persistence
  isSaving: boolean;                    // Current save operation status
  lastSaved: Date | null;               // Timestamp of last successful save
  onSave: () => void;                   // Save workflow callback
  
  // Workflow information
  workflowName?: string;                // Display name for current workflow
  
  // Auto-save configuration
  autoSaveEnabled: boolean;             // Current auto-save state
  onToggleAutoSave: () => void;         // Toggle auto-save callback
  
  // Workflow execution
  onRun: () => void;                    // Execute workflow callback
  disableRun?: boolean;                 // Whether run button should be disabled
  
  // Undo/Redo functionality
  onUndo: () => void;                   // Undo last action callback
  onRedo: () => void;                   // Redo last undone action callback
  disableUndo: boolean;                 // Whether undo button should be disabled
  disableRedo: boolean;                 // Whether redo button should be disabled
  
  // Checkpoint management
  onOpenCheckpointModal: () => void;    // Open checkpoint modal callback
}

/**
 * Header Component Implementation
 * 
 * Renders the main application header with all workflow controls
 * and system status information.
 */
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
  // ===== HOOKS & STATE =====
  
  // Theme context for light/dark mode switching
  const { theme, toggleTheme } = useTheme();
  
  // Auth context (either unified or admin)
  const authContext = useAuthContext();
  const { user, isAuthenticated, logout } = authContext || { user: null, isAuthenticated: false, logout: () => {} };
  
  // System status monitoring for resource utilization
  const { systemStatus } = useSystemStatus();
  
  // Local state for system dashboard visibility
  const [showSystemDashboard, setShowSystemDashboard] = useState(false);
  
  // Navigation hook
  const navigate = useNavigate();
  
  // State for admin dropdown menu
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  // ===== KEYBOARD SHORTCUTS =====
  
  /**
   * Set up keyboard shortcuts for undo/redo operations
   * Supports both Windows/Linux (Ctrl) and Mac (Cmd) key combinations
   */
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

    // Add event listener for keyboard shortcuts
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up event listener on component unmount
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo, disableUndo, disableRedo]);

  // Close admin menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const adminMenu = document.getElementById('admin-menu');
      const adminButton = document.getElementById('admin-button');
      
      if (adminMenu && adminButton && 
          !adminMenu.contains(event.target as Node) && 
          !adminButton.contains(event.target as Node)) {
        setShowAdminMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ===== SYSTEM STATUS UTILITIES =====
  
  /**
   * Determine system status color and message based on capacity utilization
   * Provides visual feedback about system resource availability
   */
  const getSystemStatusInfo = () => {
    if (!systemStatus) {
      return {
        color: 'gray',
        message: 'Unknown',
        indicator: 'bg-gray-400'
      };
    }

    const { capacity_utilization } = systemStatus;
    
    // Determine status based on capacity utilization percentage
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
    } else if (capacity_utilization && capacity_utilization >= 50) {
      return {
        color: 'blue',
        message: 'Moderate Load',
        indicator: 'bg-blue-500'
      };
    } else {
      return {
        color: 'green',
        message: 'Available',
        indicator: 'bg-green-500'
      };
    }
  };

  const systemStatusInfo = getSystemStatusInfo();

  // ===== NAVIGATION FUNCTIONS =====
  
  const handleAdminDashboardClick = () => {
    navigate('/admin/dashboard');
    setShowAdminMenu(false);
  };

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

          {/* User Profile and Logout */}
          <div className="flex items-center space-x-2">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2 relative">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {user?.firstName} {user?.lastName}
                  </span>
                  {/* Admin dropdown menu for admin users */}
                  {user && (user.role === 'admin' || user.role === 'super-admin') && (
                    <div className="relative">
                      <button
                        id="admin-button"
                        onClick={() => setShowAdminMenu(!showAdminMenu)}
                        className="flex items-center text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
                      >
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </button>
                      
                      {showAdminMenu && (
                        <div 
                          id="admin-menu"
                          className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700"
                        >
                          <button
                            onClick={handleAdminDashboardClick}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Admin Dashboard
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="btn btn-outline p-2 text-gray-700 dark:text-gray-300"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => window.location.href = '/login'}
                className="btn btn-primary text-sm"
              >
                Login
              </button>
            )}
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