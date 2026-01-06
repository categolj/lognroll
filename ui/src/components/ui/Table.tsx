import React from 'react';
import clsx from 'clsx';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className }) => {
  return (
    <div className="overflow-x-auto">
      <table
        className={clsx(
          'w-full text-left text-sm',
          className
        )}
      >
        {children}
      </table>
    </div>
  );
};

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
}

export const TableHead: React.FC<TableHeadProps> = ({ children, className }) => {
  return (
    <thead
      className={clsx(
        'bg-gray-50 dark:bg-dark-800 sticky top-0',
        className
      )}
    >
      {children}
    </thead>
  );
};

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return <tbody className={className}>{children}</tbody>;
};

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const TableRow: React.FC<TableRowProps> = ({ children, className, onClick }) => {
  return (
    <tr
      className={clsx(
        'border-b border-gray-100 dark:border-dark-700',
        'hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => {
  return (
    <th
      className={clsx(
        'px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap',
        className
      )}
    >
      {children}
    </th>
  );
};

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const TableCell: React.FC<TableCellProps> = ({ children, className, onClick }) => {
  return (
    <td
      className={clsx(
        'px-4 py-3 text-gray-600 dark:text-gray-400',
        onClick && 'cursor-pointer hover:text-primary-500 dark:hover:text-primary-400',
        className
      )}
      onClick={onClick}
    >
      {children}
    </td>
  );
};
