'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastProps {
  message: string;
  variant: 'success' | 'error';
  onDismiss: () => void;
}

export function Toast({ message, variant, onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl',
        'animate-fade-in font-pawprint text-sm font-semibold',
        variant === 'success'
          ? 'border-emerald-500/25 bg-[#0f0d09] text-emerald-400'
          : 'border-red-500/25 bg-[#0f0d09] text-red-400',
      )}
    >
      {variant === 'success' ? (
        <CheckCircle className="size-4 shrink-0" strokeWidth={2} />
      ) : (
        <XCircle className="size-4 shrink-0" strokeWidth={2} />
      )}
      {message}
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="ml-1 cursor-pointer opacity-50 transition-opacity hover:opacity-100"
      >
        <X className="size-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}
