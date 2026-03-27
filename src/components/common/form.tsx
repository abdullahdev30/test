import React from 'react';
import { cn } from './utils';

type FieldSize = 'sm' | 'md' | 'lg';
type FieldVariant = 'default' | 'filled';

const sizeStyles: Record<FieldSize, string> = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-3 text-sm',
  lg: 'px-5 py-4 text-base',
};

const variantStyles: Record<FieldVariant, string> = {
  default: 'bg-transparent border-text-secondary/20',
  filled: 'bg-background border-bg-primary',
};

const baseFieldStyles =
  'w-full rounded-xl border outline-none text-text-primary transition-colors focus:ring-2 focus:ring-primary/40';

type SharedFieldProps = {
  size?: FieldSize;
  variant?: FieldVariant;
  leftIcon?: React.ReactNode;
  rightNode?: React.ReactNode;
  containerClassName?: string;
};

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-2 block text-xs font-semibold text-text-primary', className)} {...props} />;
}

export function Input({
  className,
  size = 'md',
  variant = 'default',
  leftIcon,
  rightNode,
  containerClassName,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & SharedFieldProps) {
  if (!leftIcon && !rightNode) {
    return <input className={cn(baseFieldStyles, sizeStyles[size], variantStyles[variant], className)} {...props} />;
  }

  return (
    <div className={cn('relative', containerClassName)}>
      {leftIcon && (
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
          {leftIcon}
        </span>
      )}
      <input
        className={cn(
          baseFieldStyles,
          sizeStyles[size],
          variantStyles[variant],
          leftIcon && 'pl-12',
          rightNode && 'pr-12',
          className,
        )}
        {...props}
      />
      {rightNode && <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightNode}</span>}
    </div>
  );
}

export function Textarea({
  className,
  size = 'md',
  variant = 'default',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & Omit<SharedFieldProps, 'leftIcon' | 'rightNode'>) {
  return (
    <textarea
      className={cn(baseFieldStyles, sizeStyles[size], variantStyles[variant], 'min-h-[120px] resize-y', className)}
      {...props}
    />
  );
}

export function Select({
  className,
  size = 'md',
  variant = 'default',
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & Omit<SharedFieldProps, 'leftIcon' | 'rightNode'>) {
  return <select className={cn(baseFieldStyles, sizeStyles[size], variantStyles[variant], className)} {...props} />;
}

export function Checkbox({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="checkbox" className={cn('h-4 w-4 accent-primary', className)} {...props} />;
}
