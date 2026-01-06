import React from 'react';
import clsx from 'clsx';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  className,
  id,
  ...props
}) => {
  const checkboxId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <label
      htmlFor={checkboxId}
      className={clsx(
        'inline-flex items-center gap-2 cursor-pointer select-none',
        props.disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input
        type="checkbox"
        id={checkboxId}
        className={clsx(
          'h-4 w-4 rounded border-gray-300 text-primary-500 transition-colors',
          'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          'dark:border-dark-700 dark:bg-dark-800 dark:checked:bg-primary-500',
          'disabled:cursor-not-allowed'
        )}
        {...props}
      />
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    </label>
  );
};
