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
  fieldSize?: FieldSize;
  variant?: FieldVariant;
  leftIcon?: React.ReactNode;
  rightNode?: React.ReactNode;
  containerClassName?: string;
};

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> &
  SharedFieldProps;
type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> &
  Omit<SharedFieldProps, 'leftIcon' | 'rightNode'>;
type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> &
  Omit<SharedFieldProps, 'leftIcon' | 'rightNode'>;

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-2 block text-xs font-semibold text-text-primary', className)} {...props} />;
}

export const Input = React.forwardRef<
  HTMLInputElement,
  InputProps
>(function Input(
  {
    className,
    fieldSize = 'md',
    variant = 'default',
    leftIcon,
    rightNode,
    containerClassName,
    ...props
  },
  ref,
) {
  if (!leftIcon && !rightNode) {
    return (
      <input
        ref={ref}
        className={cn(baseFieldStyles, sizeStyles[fieldSize], variantStyles[variant], className)}
        {...props}
      />
    );
  }

  return (
    <div className={cn('relative', containerClassName)}>
      {leftIcon && (
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          baseFieldStyles,
          sizeStyles[fieldSize],
          variantStyles[variant],
          Boolean(leftIcon) && 'pl-12',
          Boolean(rightNode) && 'pr-12',
          className,
        )}
        {...props}
      />
      {rightNode && <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightNode}</span>}
    </div>
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>(function Textarea({ className, fieldSize = 'md', variant = 'default', ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(baseFieldStyles, sizeStyles[fieldSize], variantStyles[variant], 'min-h-[120px] resize-y', className)}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  SelectProps
>(function Select({ className, fieldSize = 'md', variant = 'default', ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(baseFieldStyles, sizeStyles[fieldSize], variantStyles[variant], className)}
      {...props}
    />
  );
});

export const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Checkbox({ className, ...props }, ref) {
  return <input ref={ref} type="checkbox" className={cn('h-4 w-4 accent-primary', className)} {...props} />;
});
