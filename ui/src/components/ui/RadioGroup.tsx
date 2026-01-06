import React from 'react';
import { RadioGroup as HeadlessRadioGroup } from '@headlessui/react';
import clsx from 'clsx';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  label?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  disabled?: boolean;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
  className,
}) => {
  return (
    <HeadlessRadioGroup
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={clsx('inline-flex items-center', className)}
    >
      {label && (
        <HeadlessRadioGroup.Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
          {label}
        </HeadlessRadioGroup.Label>
      )}
      <div className="inline-flex items-center gap-3">
        {options.map((option) => (
          <HeadlessRadioGroup.Option
            key={option.value}
            value={option.value}
            className={clsx(
              'inline-flex items-center gap-1.5 cursor-pointer select-none text-sm outline-none',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {({ checked }) => (
              <>
                <span
                  className={clsx(
                    'h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors',
                    checked
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300 dark:border-dark-700'
                  )}
                >
                  <span className={clsx(
                    'h-1.5 w-1.5 rounded-full bg-white transition-opacity',
                    checked ? 'opacity-100' : 'opacity-0'
                  )} />
                </span>
                <span className={clsx(
                  checked
                    ? 'text-primary-600 dark:text-primary-500'
                    : 'text-gray-600 dark:text-gray-400'
                )}>{option.label}</span>
              </>
            )}
          </HeadlessRadioGroup.Option>
        ))}
      </div>
    </HeadlessRadioGroup>
  );
};
