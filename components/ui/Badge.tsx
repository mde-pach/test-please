import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
      success: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300',
      danger: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300',
      warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300',
      info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    };

    return (
      <span
        ref={ref}
        className={cn('inline-flex items-center font-medium rounded-full', variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
