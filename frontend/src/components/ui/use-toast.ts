import { toast as hotToast } from 'react-hot-toast';
import * as React from 'react';

type ToastVariant = 'default' | 'destructive' | 'success';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export function useToast() {
  const toast = React.useCallback(({
    title,
    description,
    variant = 'default',
    duration = 5000,
  }: ToastOptions) => {
    const style = {
      default: 'bg-white text-gray-900 border border-gray-200',
      destructive: 'bg-red-100 text-red-900 border border-red-200',
      success: 'bg-green-100 text-green-900 border border-green-200',
    };

    const toastContent = React.createElement(
      'div',
      { 
        className: `p-4 rounded-md shadow-md ${style[variant]}`,
        key: `toast-${Date.now()}`
      },
      [
        React.createElement('div', { className: 'font-medium', key: 'title' }, title),
        description && React.createElement('div', { className: 'text-sm mt-1', key: 'description' }, description)
      ].filter(Boolean)
    );

    return hotToast(toastContent, { duration });
  }, []);

  return { toast };
}
