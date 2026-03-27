import { Loader2 } from 'lucide-react';
import { cn } from './utils';

type SpinnerSize = 'sm' | 'md' | 'lg';

const sizeMap: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
};

export default function Spinner({
  className,
  size = 'md',
}: {
  className?: string;
  size?: SpinnerSize;
}) {
  return <Loader2 className={cn('animate-spin', sizeMap[size], className)} aria-hidden="true" />;
}
