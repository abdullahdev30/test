import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from './utils';

export type AlertVariant = 'default' | 'success' | 'alert';

const containerStyles: Record<AlertVariant, string> = {
  default: 'border border-text-secondary/10 bg-bg-primary text-text-primary',
  success: 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-700',
  alert: 'border border-red-500/20 bg-red-500/10 text-red-600',
};

const iconByVariant: Record<AlertVariant, ReactNode> = {
  default: <Info size={16} />,
  success: <CheckCircle2 size={16} />,
  alert: <AlertCircle size={16} />,
};

export default function Alert({
  variant = 'default',
  children,
  className,
  icon,
}: {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <div className={cn('rounded-xl px-4 py-3 text-sm font-medium', containerStyles[variant], className)}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0">{icon ?? iconByVariant[variant]}</span>
        <div>{children}</div>
      </div>
    </div>
  );
}
