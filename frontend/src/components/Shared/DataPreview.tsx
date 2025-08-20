// frontend/src/components/Shared/DataPreview.tsx
import React from 'react';
import { DatasetPreview } from '../../types';

interface DataPreviewProps {
  preview: DatasetPreview;
}

const DataPreview: React.FC<DataPreviewProps> = ({ preview }) => (
  <div className="mb-4 overflow-auto border rounded-md">
    <div className="p-2 bg-gray-100 font-medium">Preview ({preview.totalRows} rows)</div>
    <table className="min-w-full text-sm">
      <thead className="bg-gray-50">
        <tr>
          {preview.headers.map((h, i) => (
            <th key={i} className="px-2 py-1 border">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {preview.rows.map((row, ri) => (
          <tr key={ri} className={ri % 2 ? 'bg-white' : 'bg-gray-50'}>
            {row.map((cell, ci) => (
              <td key={ci} className="px-2 py-1 border">{String(cell)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default DataPreview;
