import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/components/atoms/Button';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

export interface AlertAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}

export interface AlertProps {
  /** Alert variant */
  variant: AlertVariant;
  /** Alert title */
  title?: string;
  /** Alert message content (legacy children prop) */
  children?: React.ReactNode;
  /** Alert description (alternative to children) */
  description?: React.ReactNode;
  /** Single action button */
  action?: AlertAction;
  /** Optional action buttons (for multiple actions) */
  actions?: React.ReactNode;
  /** Whether the alert can be dismissed */
  dismissible?: boolean;
  /** Callback when alert is dismissed */
  onDismiss?: () => void;
  /** Custom icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Additional CSS classes */
  className?: string;
}

const alertVariants = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-500',
    titleColor: 'text-green-800',
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: AlertCircle,
    iconColor: 'text-red-500',
    titleColor: 'text-red-800',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    titleColor: 'text-yellow-800',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: Info,
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-800',
  },
};

export const Alert: React.FC<AlertProps> = ({
  variant,
  title,
  children,
  description,
  action,
  actions,
  dismissible = false,
  onDismiss,
  icon,
  className,
}) => {
  const variantConfig = alertVariants[variant];
  const IconComponent = icon || variantConfig.icon;

  // Use description if provided, otherwise fall back to children
  const content = description || children;

  // Create action buttons if action prop is provided
  const actionButtons = action ? (
    <Button
      size='sm'
      variant={action.variant || 'outline'}
      onClick={action.onClick}
    >
      {action.label}
    </Button>
  ) : (
    actions
  );

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        variantConfig.container,
        className
      )}
      role='alert'
    >
      <div className='flex items-start space-x-3'>
        <div className='flex-shrink-0'>
          <IconComponent
            className={cn('h-5 w-5', variantConfig.iconColor)}
            aria-hidden='true'
          />
        </div>

        <div className='flex-1 min-w-0'>
          {title && (
            <h3
              className={cn(
                'text-sm font-medium mb-1',
                variantConfig.titleColor
              )}
            >
              {title}
            </h3>
          )}
          <div className='text-sm'>{content}</div>

          {actionButtons && <div className='mt-3'>{actionButtons}</div>}
        </div>

        {dismissible && onDismiss && (
          <div className='flex-shrink-0'>
            <button
              type='button'
              className='inline-flex rounded-md p-1.5 hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current'
              onClick={onDismiss}
              aria-label='Dismiss alert'
            >
              <X className='h-4 w-4' aria-hidden='true' />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Convenience components
export const SuccessAlert: React.FC<Omit<AlertProps, 'variant'>> = props => (
  <Alert variant='success' {...props} />
);

export const ErrorAlert: React.FC<Omit<AlertProps, 'variant'>> = props => (
  <Alert variant='error' {...props} />
);

export const WarningAlert: React.FC<Omit<AlertProps, 'variant'>> = props => (
  <Alert variant='warning' {...props} />
);

export const InfoAlert: React.FC<Omit<AlertProps, 'variant'>> = props => (
  <Alert variant='info' {...props} />
);
