import React, { forwardRef } from 'react';
import clsx from 'clsx';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={clsx(
            'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 transition-colors',
            'focus:outline-none focus:ring-1',
            'dark:bg-dark-800 dark:text-gray-100',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-status-error focus:border-status-error focus:ring-status-error'
              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:border-dark-700 dark:focus:border-primary-500',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-status-error">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
