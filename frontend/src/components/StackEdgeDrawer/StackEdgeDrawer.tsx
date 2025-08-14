import { useState, useEffect, useRef } from "react";
import { X, FileCog, ClipboardCheck, Archive } from "lucide-react";
import PropertiesPanel from "../PropertiesPanel/PropertiesPanel";
import ValidationPanel from "../ValidationPanel/ValidationPanel";
import CheckpointDrawer from "../CheckpointDrawer/CheckpointDrawer";
import type { Node, Edge } from "reactflow";
import { NodeData, ValidationError } from '../../types';

interface StackEdgeDrawerProps {
  selectedNode: Node<NodeData> | null;
  onNodeUpdate: (nodeId: string, newData: Partial<NodeData>) => void;
  validationErrors: ValidationError[];
  nodes: Node<NodeData>[];
  edges: Edge[];
  onFocusNode: (id: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  // Checkpoint props
  workflowId: string;
  onRestoreCheckpoint: (checkpointId: string) => void;
}

type DrawerTab = "properties" | "validation" | "checkpoints" | null;

export default function StackEdgeDrawer({
  selectedNode,
  onNodeUpdate,
  validationErrors,
  nodes,
  edges,
  onFocusNode,
  workflowId,
  onRestoreCheckpoint,
}: StackEdgeDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const mouseMoveRef = useRef(false);

  // Auto-open properties panel when a node is selected
  useEffect(() => {
    if (selectedNode) {
      setActiveTab("properties");
    } else if (activeTab === "properties") {
      setActiveTab(null);
    }
  }, [selectedNode]);

  const isOpen = activeTab !== null;

  const handleMouseDown = (e: React.MouseEvent, buttonId: string) => {
    e.preventDefault();
    setIsDragging(true);
    mouseMoveRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartRef.current) return;
      
      const deltaX = Math.abs(moveEvent.clientX - dragStartRef.current.x);
      const deltaY = Math.abs(moveEvent.clientY - dragStartRef.current.y);
      
      // If mouse moved more than 3px, consider it a drag
      if (deltaX > 3 || deltaY > 3) {
        mouseMoveRef.current = true;
        // Open the panel immediately on first drag movement
        setActiveTab(buttonId as DrawerTab);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      
      // If it was a click (no mouse movement), handle click logic
      if (!mouseMoveRef.current) {
        handleButtonClick(buttonId as DrawerTab);
      }
      
      dragStartRef.current = null;
      mouseMoveRef.current = false;
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleButtonClick = (tab: DrawerTab) => {
    if (activeTab === tab) {
      // If clicking the active tab, close it
      setActiveTab(null);
    } else {
      // If clicking a different tab, switch to it
      setActiveTab(tab);
    }
  };

  const closeDrawer = () => setActiveTab(null);

  const buttons = [
    {
      id: "properties",
      icon: FileCog,
      label: "Properties",
      hasError: false,
    },
    {
      id: "validation",
      icon: ClipboardCheck,
      label: "Validation",
      hasError: validationErrors.length > 0,
    },
    {
      id: "checkpoints",
      icon: Archive,
      label: "Checkpoints",
      hasError: false,
    },
  ];

  return (
    <>
      {/* Stack of Edge Buttons */}
      <div 
        className={`
          fixed top-20 z-40 flex flex-col transition-all duration-200
          ${isOpen ? 'right-96' : 'right-0'}
        `}
      >
        {buttons.map((button, index) => {
          const Icon = button.icon;
          const isActive = activeTab === button.id;
          const isHovered = hoveredButton === button.id;
          const tabId = `${button.id}-panel`;

          return (
            <div key={button.id} className="relative">
              <button
                onMouseDown={(e) => handleMouseDown(e, button.id)}
                onMouseEnter={() => setHoveredButton(button.id)}
                onMouseLeave={() => setHoveredButton(null)}
                className={`
                  relative w-12 h-12 rounded-l-xl
                  flex items-center justify-center
                  transition-all duration-200 ease-out
                  shadow-lg hover:shadow-xl
                  group select-none
                  ${
                    isActive
                      ? "bg-blue-600 text-white translate-x-0 shadow-blue-200"
                      : isHovered
                      ? "bg-white text-gray-700 -translate-x-1 shadow-md"
                      : "bg-white text-gray-600 translate-x-2 shadow-sm hover:-translate-x-1"
                  }
                  ${index > 0 ? "mt-1" : ""}
                  ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
                `}
                aria-label={button.label}
                aria-expanded={isActive}
                aria-controls={tabId}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? "scale-110" : "group-hover:scale-105"
                  }`}
                />

                {/* Error indicator */}
                {button.hasError && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                )}

                {/* Tooltip */}
                {isHovered && !isActive && !isOpen && (
                  <div
                    role="tooltip"
                    className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 animate-in fade-in duration-150"
                  >
                    {button.label}
                    <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900" />
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Sliding Panel */}
      <div
        id="drawer-container"
        className={`
          fixed top-16 right-0 h-[calc(100vh-4rem)] w-96
          bg-white dark:bg-gray-800
          border-l border-gray-200 dark:border-gray-700
          transform transition-all duration-200 ease-out
          z-30
          ${isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
        `}
      >
        {activeTab && (
          <>
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center space-x-3 capitalize">
                {activeTab === "properties" && (
                  <FileCog className="w-5 h-5 text-blue-600" />
                )}
                {activeTab === "validation" && (
                  <ClipboardCheck className="w-5 h-5 text-blue-600" />
                )}
                {activeTab === "checkpoints" && (
                  <Archive className="w-5 h-5 text-blue-600" />
                )}
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {activeTab}
                </h2>
              </div>
              <button
                onClick={closeDrawer}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close panel"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Panel Content */}
            <div
              id={`${activeTab}-panel`}
              className="flex-1 overflow-y-auto"
              role="region"
              aria-label={`${activeTab} panel`}
            >
              {activeTab === "properties" && (
                <PropertiesPanel
                  selectedNode={selectedNode}
                  onNodeUpdate={onNodeUpdate}
                  collapsed={false}
                  isOpen={true}
                  onClose={closeDrawer}
                />
              )}

              {activeTab === "validation" && (
                <ValidationPanel
                  isOpen={true}
                  onClose={closeDrawer}
                  errors={validationErrors}
                  nodes={nodes}
                  edges={edges}
                  onFocusNode={onFocusNode}
                />
              )}

              {activeTab === "checkpoints" && (
                <CheckpointDrawer
                  workflowId={workflowId}
                  onRestore={onRestoreCheckpoint}
                />
              )}
            </div>

            {/* Panel Footer */}
            <div className="border-t border-gray-100 dark:border-gray-700 p-4 bg-gray-50/30 dark:bg-gray-800/30 text-xs text-gray-500 dark:text-gray-400 text-center">
              {activeTab === "properties" &&
                selectedNode &&
                `Selected: ${selectedNode.data?.label || selectedNode.id}`}
              {activeTab === "validation" &&
                `${validationErrors.length} validation ${validationErrors.length === 1 ? 'issue' : 'issues'}`}
              {activeTab === "checkpoints" &&
                "Manage workflow checkpoints"}
            </div>
          </>
        )}
      </div>
    </>
  );
}
