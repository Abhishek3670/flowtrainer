import React from 'react';

export default function AdminDashboard() {
  const widgets = [
    { title: 'Users', value: '-', description: 'Total users' },
    { title: 'Workflows', value: '-', description: 'Total workflows' },
    { title: 'DB Connections', value: '-', description: 'Configured databases' },
    { title: 'Models', value: '-', description: 'Available ML models' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {widgets.map((w) => (
        <div key={w.title} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-300">{w.title}</div>
          <div className="text-2xl font-semibold mt-1">{w.value}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{w.description}</div>
        </div>
      ))}
    </div>
  );
}


