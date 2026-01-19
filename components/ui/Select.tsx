import React from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full px-3 py-2 border rounded-lg transition-colors',
            'bg-white dark:bg-gray-900 text-gray-900 dark:text-white',
            'border-gray-300 dark:border-gray-600',
            'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-danger-500 focus:ring-danger-500',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
