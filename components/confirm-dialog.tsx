'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  /** Optional highlighted block under the message (e.g. a refund preview). */
  details?: ReactNode;
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
  details,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const triggerRef = useRef<Element | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Store trigger element; focus cancel button on open; restore focus on close
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
      const t = setTimeout(() => cancelBtnRef.current?.focus(), 30);
      return () => clearTimeout(t);
    } else {
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    }
  }, [isOpen]);

  // Escape key closes
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
      className="animate-overlay-in fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="animate-dialog-in w-full max-w-[400px] overflow-hidden rounded-t-2xl border border-paw/[0.1] bg-[#1a1612] shadow-2xl sm:rounded-2xl">
        {/* Destructive accent stripe */}
        {destructive && (
          <div className="h-px w-full bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
        )}

        <div className="p-6">
          {/* Icon + title + message */}
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-full border',
                destructive ? 'border-red-500/20 bg-red-500/10' : 'border-doggy/20 bg-doggy/10',
              )}
            >
              {destructive ? (
                <AlertTriangle className="size-5 text-red-400" strokeWidth={1.5} />
              ) : (
                <Info className="size-5 text-doggy" strokeWidth={1.5} />
              )}
            </div>
            <div className="min-w-0 pt-0.5">
              <h2
                id="confirm-title"
                className="font-elegant text-lg font-black leading-tight text-paw"
              >
                {title}
              </h2>
              <p
                id="confirm-message"
                className="mt-1.5 font-pawprint text-sm leading-relaxed text-paw/55"
              >
                {message}
              </p>
            </div>
          </div>

          {/* Optional details block (e.g. refund preview) */}
          {details && (
            <div className="mt-4 rounded-xl border border-paw/[0.1] bg-white/[0.03] px-4 py-3 font-pawprint text-sm text-paw/75">
              {details}
            </div>
          )}

          {/* Actions — stacked on mobile (primary on top), row on sm+ */}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
            <button
              ref={cancelBtnRef}
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-paw/[0.12] bg-white/[0.03] py-2.5 font-pawprint text-sm font-semibold text-paw/60 transition-all duration-200 hover:border-paw/25 hover:bg-white/[0.06] hover:text-paw/80"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={cn(
                'flex-1 rounded-xl py-2.5 font-pawprint text-sm font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0',
                destructive
                  ? 'bg-red-500 shadow-red-500/20 hover:bg-red-400 hover:shadow-red-500/35'
                  : 'bg-doggy shadow-doggy/25 hover:bg-doggy/90 hover:shadow-doggy/40',
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
