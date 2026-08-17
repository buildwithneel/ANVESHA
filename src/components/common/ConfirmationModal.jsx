import React, { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export function ConfirmationModal({
  isOpen,
  title = 'Confirm Operational Action',
  message = 'Are you sure you want to perform this operational action?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning', // 'warning' | 'danger' | 'info'
  onConfirm,
  onCancel,
}) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isOpen && e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    if (variant === 'danger') {
      return {
        icon: <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />,
        confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
      };
    }
    if (variant === 'info') {
      return {
        icon: <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
        confirmBtn: 'bg-accent hover:bg-accent-hover text-white',
      };
    }
    return {
      icon: <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
    };
  };

  const { icon, confirmBtn } = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
    >
      <div
        className="w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl p-5 space-y-4 text-text-primary animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-surface-raised border border-border flex-shrink-0">
            {icon}
          </div>
          <div className="space-y-1">
            <h2 id="confirmation-title" className="text-sm font-bold text-text-primary">
              {title}
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg border border-border bg-surface-raised hover:bg-surface-hover text-text-secondary text-xs font-semibold transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            className={cn('px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-xs', confirmBtn)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
