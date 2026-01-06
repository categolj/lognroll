import React from 'react';
import clsx from 'clsx';

type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'debug' | 'trace' | 'other';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  onClick?: () => void;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 dark:bg-dark-700 dark:text-gray-300',
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  debug: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  trace: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  other: 'bg-gray-50 text-gray-400 dark:bg-gray-900 dark:text-gray-500',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className,
  onClick,
}) => {
  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      onClick={onClick}
    >
      {children}
    </Component>
  );
};
