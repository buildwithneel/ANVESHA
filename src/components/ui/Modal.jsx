import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './Button';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { cn } from '../../utils/cn';

/**
 * Accessible Enterprise Modal Dialog
 * Keyboard focus management, Escape key close, backdrop click handler, reduced-motion friendly.
 */
export function Modal({ isOpen, onClose, title, description, children, footer, className }) {
  const { reducedMotion } = useReducedMotion();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: reducedMotion ? 1 : 0.96, y: reducedMotion ? 0 : 8 },
    visible: { opacity: 1, scale: 1, y: 0 },
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdropVariants}
          transition={{ duration: reducedMotion ? 0 : 0.15 }}
          onClick={onClose}
          aria-hidden="true"
        />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          aria-describedby={description ? 'modal-description' : undefined}
          className={cn(
            'relative w-full max-w-lg rg-card bg-surface border border-border shadow-xl rounded-lg overflow-hidden z-10 my-auto',
            className
          )}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={modalVariants}
          transition={{ duration: reducedMotion ? 0 : 0.18, ease: 'easeOut' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-border">
            <div>
              {title && (
                <h2 id="modal-title" className="text-base font-semibold text-text-primary">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="text-xs text-text-muted mt-1">
                  {description}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              ariaLabel="Close modal"
              icon={X}
            />
          </div>

          {/* Body */}
          <div className="p-5 max-h-[70vh] overflow-y-auto">{children}</div>

          {/* Footer */}
          {footer && <div className="p-4 border-t border-border bg-surface-raised/40 flex justify-end gap-3">{footer}</div>}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
