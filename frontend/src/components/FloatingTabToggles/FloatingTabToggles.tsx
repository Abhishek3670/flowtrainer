import React from 'react';
import { FileCog, ClipboardCheck } from 'lucide-react';

interface FloatingTabTogglesProps {
  activeTab: 'properties' | 'validation';
  onSelect: (tab: 'properties' | 'validation') => void;
}

export default function FloatingTabToggles({
  activeTab,
  onSelect,
}: FloatingTabTogglesProps) {
  return (
    <div className="absolute top-16 right-0 flex h-10">
      {/* Properties Leaf */}
      <button
        onClick={() => onSelect('properties')}
        className={`
          flex items-center justify-center
          w-10 h-full
          rounded-l-full rounded-r-none
          transition-colors
          ${activeTab === 'properties'
            ? 'bg-green-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          }
        `}
        title="Properties"
      >
        <FileCog className="w-5 h-5" />
      </button>

      {/* Validation Leaf */}
      <button
        onClick={() => onSelect('validation')}
        className={`
          flex items-center justify-center
          w-10 h-full
          rounded-r-full rounded-l-none
          transition-colors
          ${activeTab === 'validation'
            ? 'bg-green-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          }
        `}
        title="Validation"
      >
        <ClipboardCheck className="w-5 h-5" />
      </button>
    </div>
  );
}
