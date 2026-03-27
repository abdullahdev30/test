import type { HTMLAttributes } from 'react';
import { cn } from './utils';

type CardVariant = 'default' | 'soft' | 'elevated';

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-bg-primary border border-text-secondary/10',
  soft: 'bg-secondary border border-text-secondary/10',
  elevated: 'bg-bg-primary border border-text-secondary/10 shadow-sm',
};

export default function Card({
  variant = 'default',
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: CardVariant }) {
  return <div className={cn('rounded-2xl', variantStyles[variant], className)} {...props} />;
}
