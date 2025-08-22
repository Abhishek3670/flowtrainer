import React, { ChangeEvent } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { UploadProgress } from '../../types';

interface FileUploadSectionProps {
  label: string;
  accept: string;
  maxSize: number; // bytes
  uploadProgress?: UploadProgress | null;
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  label,
  accept,
  maxSize,
  uploadProgress,
  onFileSelect,
  disabled = false,
}) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onFileSelect(file);
    e.target.value = '';
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <div
        className={`flex items-center justify-center border-2 border-dashed rounded-lg p-4 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <input
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={handleChange}
          className="hidden"
          id="file-upload-input"
        />
        <label
          htmlFor="file-upload-input"
          className={`flex flex-col items-center cursor-pointer ${
            disabled ? 'cursor-not-allowed' : ''
          }`}
        >
          {uploadProgress ? (
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 text-blue-600 mb-2 animate-spin" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Uploading... {uploadProgress.percentage}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {uploadProgress ? `${uploadProgress.loaded} / ${uploadProgress.total}` : ''}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">Click to upload file</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Accepted types: {accept}, max size {(maxSize / (1024 * 1024)).toFixed(0)}MB
              </p>
            </div>
          )}
        </label>
      </div>
    </div>
  );
};

export default FileUploadSection;
