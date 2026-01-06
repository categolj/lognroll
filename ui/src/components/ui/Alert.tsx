import React from 'react';
import clsx from 'clsx';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

type AlertStatus = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  status: AlertStatus;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

const icons: Record<AlertStatus, React.ElementType> = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
};

const styles: Record<AlertStatus, string> = {
  success: 'bg-green-50 border-status-success text-green-800 dark:bg-green-900/20 dark:text-green-300',
  error: 'bg-red-50 border-status-error text-red-800 dark:bg-red-900/20 dark:text-red-300',
  warning: 'bg-yellow-50 border-status-warning text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  info: 'bg-blue-50 border-status-info text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
};

const iconStyles: Record<AlertStatus, string> = {
  success: 'text-status-success',
  error: 'text-status-error',
  warning: 'text-status-warning',
  info: 'text-status-info',
};

export const Alert: React.FC<AlertProps> = ({
  status,
  children,
  className,
  onClose,
}) => {
  const Icon = icons[status];

  return (
    <div
      role="alert"
      className={clsx(
        'flex items-start gap-3 p-4 rounded-lg border-l-4',
        styles[status],
        className
      )}
    >
      <Icon className={clsx('h-5 w-5 flex-shrink-0', iconStyles[status])} />
      <div className="flex-1 text-sm font-medium">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-auto -mr-1 -mt-1 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};
