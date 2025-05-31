'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Toast as ToastType, ToastVariant } from './types';

const toastVariants = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-500',
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: AlertCircle,
    iconColor: 'text-red-500',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: Info,
    iconColor: 'text-blue-500',
  },
};

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const variant = toastVariants[toast.variant];
  const IconComponent = toast.icon || variant.icon;

  // Auto-dismiss timer
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleRemove();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 200);
  };

  return (
    <div
      className={cn(
        'pointer-events-auto max-w-sm w-full rounded-lg border shadow-lg transition-all duration-200 ease-in-out',
        variant.container,
        {
          'transform translate-x-0 opacity-100': isVisible && !isExiting,
          'transform translate-x-full opacity-0': !isVisible || isExiting,
        }
      )}
      role='alert'
      aria-live='polite'
    >
      <div className='p-4'>
        <div className='flex items-start space-x-3'>
          <div className='flex-shrink-0'>
            <IconComponent
              className={cn('h-5 w-5', variant.iconColor)}
              aria-hidden='true'
            />
          </div>

          <div className='flex-1 min-w-0'>
            {toast.title && (
              <p className='text-sm font-medium mb-1'>{toast.title}</p>
            )}
            <p className='text-sm'>{toast.message}</p>

            {toast.action && (
              <div className='mt-3'>
                <button
                  type='button'
                  className='text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded'
                  onClick={toast.action.onClick}
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>

          {toast.closable !== false && (
            <div className='flex-shrink-0'>
              <button
                type='button'
                className='inline-flex rounded-md p-1.5 hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current'
                onClick={handleRemove}
                aria-label='Dismiss notification'
              >
                <X className='h-4 w-4' aria-hidden='true' />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
