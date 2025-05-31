'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Toast } from './Toast';
import { Toast as ToastType } from './types';
import { cn } from '@/shared/utils/cn';

export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center';

interface ToastContainerProps {
  toasts: ToastType[];
  position?: ToastPosition;
  onRemove: (id: string) => void;
  maxToasts?: number;
}

const positionClasses: Record<ToastPosition, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  position = 'top-right',
  onRemove,
  maxToasts = 5,
}) => {
  // Limit number of visible toasts
  const visibleToasts = toasts.slice(0, maxToasts);

  if (typeof document === 'undefined' || visibleToasts.length === 0) {
    return null;
  }

  return createPortal(
    <div
      className={cn(
        'fixed z-50 pointer-events-none',
        positionClasses[position]
      )}
      aria-live='polite'
      aria-label='Notifications'
    >
      <div className='flex flex-col space-y-2'>
        {visibleToasts.map(toast => (
          <Toast key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </div>
    </div>,
    document.body
  );
};
