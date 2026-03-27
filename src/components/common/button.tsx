import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from './utils';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'alert'
  | 'success'
  | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const baseStyles =
  'inline-flex items-center justify-center rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20',
  secondary: 'bg-secondary text-text-primary hover:bg-secondary/80 border border-text-secondary/10',
  outline:
    'bg-transparent border border-text-secondary/20 text-text-secondary hover:border-text-secondary/40 hover:text-text-primary',
  ghost: 'bg-transparent text-text-secondary hover:bg-text-secondary/5 hover:text-text-primary',
  alert: 'bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-500/20',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-500/20',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-5 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
  icon: 'p-2.5',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {children && <span className="ml-2">{children}</span>}
        </>
      ) : (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
