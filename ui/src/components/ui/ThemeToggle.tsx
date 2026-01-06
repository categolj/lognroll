import React from 'react';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../hooks/useTheme';
import clsx from 'clsx';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { theme, toggleTheme } = useTheme();

  const icons = {
    light: SunIcon,
    dark: MoonIcon,
    system: ComputerDesktopIcon,
  };

  const labels = {
    light: 'Light mode',
    dark: 'Dark mode',
    system: 'System theme',
  };

  const Icon = icons[theme];

  return (
    <button
      onClick={toggleTheme}
      className={clsx(
        'p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-700 transition-colors',
        className
      )}
      title={labels[theme]}
      aria-label={labels[theme]}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
};
