import React, { useState } from 'react';

interface AutoSaveSettingsProps {
  enabled: boolean;
  interval: number;
  debounceDelay: number;
  maxAutoSaves: number;
  onSettingsChange: (settings: {
    enabled: boolean;
    interval: number;
    debounceDelay: number;
    maxAutoSaves: number;
  }) => void;
}

export const AutoSaveSettings: React.FC<AutoSaveSettingsProps> = ({
  enabled,
  interval,
  debounceDelay,
  maxAutoSaves,
  onSettingsChange
}) => {
  const [localEnabled, setLocalEnabled] = useState(enabled);
  const [localInterval, setLocalInterval] = useState(interval / 1000); // Convert to seconds for display
  const [localDebounce, setLocalDebounce] = useState(debounceDelay / 1000);
  const [localMaxSaves, setLocalMaxSaves] = useState(maxAutoSaves);

  const handleApply = () => {
    onSettingsChange({
      enabled: localEnabled,
      interval: localInterval * 1000, // Convert back to milliseconds
      debounceDelay: localDebounce * 1000,
      maxAutoSaves: localMaxSaves
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Auto-Save Settings
      </h3>
      
      <div className="space-y-4">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable Auto-Save
          </label>
          <input
            type="checkbox"
            checked={localEnabled}
            onChange={(e) => setLocalEnabled(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        {/* Interval */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Save Interval (seconds)
          </label>
          <input
            type="number"
            min="5"
            max="300"
            value={localInterval}
            onChange={(e) => setLocalInterval(parseInt(e.target.value) || 30)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            disabled={!localEnabled}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            How often to automatically save (5-300 seconds)
          </p>
        </div>

        {/* Debounce Delay */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Debounce Delay (seconds)
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={localDebounce}
            onChange={(e) => setLocalDebounce(parseInt(e.target.value) || 2)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            disabled={!localEnabled}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Wait time after last change before saving (1-10 seconds)
          </p>
        </div>

        {/* Max Auto-Saves */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Max Auto-Saves to Keep
          </label>
          <input
            type="number"
            min="3"
            max="50"
            value={localMaxSaves}
            onChange={(e) => setLocalMaxSaves(parseInt(e.target.value) || 10)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            disabled={!localEnabled}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Maximum number of auto-saves to store (3-50)
          </p>
        </div>

        {/* Apply Button */}
        <button
          onClick={handleApply}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
        >
          Apply Settings
        </button>
      </div>
    </div>
  );
};
