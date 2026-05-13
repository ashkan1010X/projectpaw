'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-sm rounded-2xl border border-paw/[0.12] bg-[#1a1612] p-6 shadow-2xl">
        <h2
          id="confirm-title"
          className="font-elegant text-xl font-black text-paw"
        >
          {title}
        </h2>
        <p
          id="confirm-message"
          className="mt-2 font-pawprint text-sm text-paw/55"
        >
          {message}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-paw/[0.12] bg-white/[0.03] py-2.5 font-pawprint text-sm font-semibold text-paw/60 transition-all duration-200 hover:border-paw/25 hover:text-paw/80"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'flex-1 rounded-xl py-2.5 font-pawprint text-sm font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5',
              destructive
                ? 'bg-red-500 shadow-red-500/25 hover:bg-red-400 hover:shadow-red-500/40'
                : 'bg-doggy shadow-doggy/25 hover:shadow-doggy/40',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
