const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export interface FileData {
  _id: string;
  fileId?: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  duration?: number;
  resolution?: {
    width: number;
    height: number;
  };
  status: 'uploading' | 'processing' | 'ready' | 'error';
  uploadedAt: string;
  path?: string;
  thumbnailPath?: string;
}

export interface FileApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class FileAPI {
  // Upload file with progress tracking
  async uploadFile(
    file: File, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<FileApiResponse<FileData>> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('video', file);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100)
          };
          onProgress(progress);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(response);
          } else {
            reject(new Error(response.message || 'Upload failed'));
          }
        } catch (error) {
          reject(new Error('Invalid server response'));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', `${API_BASE}/files/upload`);
      xhr.send(formData);
    });
  }

  // Get video stream URL
  getVideoStreamUrl(fileId: string): string {
    return `${API_BASE}/files/${fileId}/stream`;
  }

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Validate video file
  validateVideoFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 500 * 1024 * 1024; // 500MB
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/avi'];
    const allowedExtensions = ['.mp4', '.mov', '.avi', '.m4v'];
    
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 500MB' };
    }

    const isValidType = allowedTypes.includes(file.type) || 
                       allowedExtensions.includes(fileExtension);
    
    if (!isValidType) {
      return { 
        valid: false, 
        error: 'Please upload MP4, MOV, or AVI video files only' 
      };
    }

    return { valid: true };
  }
}

export const fileAPI = new FileAPI();
