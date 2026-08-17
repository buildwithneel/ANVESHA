import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './Button';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { cn } from '../../utils/cn';

/**
 * Slide-out Drawer for detailed inspection of cameras, incidents, and worker profiles
 */
export function Drawer({ isOpen, onClose, title, subtitle, children, footer, className }) {
  const { reducedMotion } = useReducedMotion();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
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

  const drawerVariants = {
    hidden: { x: reducedMotion ? 0 : '100%', opacity: reducedMotion ? 0 : 1 },
    visible: { x: 0, opacity: 1 },
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.15 }}
          onClick={onClose}
        />

        {/* Drawer Content */}
        <motion.div
          role="dialog"
          aria-modal="true"
          className={cn(
            'relative w-full max-w-md h-full bg-surface border-l border-border shadow-2xl flex flex-col z-10',
            className
          )}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={drawerVariants}
          transition={{ duration: reducedMotion ? 0 : 0.2, ease: 'easeOut' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-border">
            <div>
              <h2 className="text-base font-semibold text-text-primary">{title}</h2>
              {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} ariaLabel="Close drawer" icon={X} />
          </div>

          {/* Body */}
          <div className="flex-1 p-5 overflow-y-auto">{children}</div>

          {/* Footer */}
          {footer && <div className="p-4 border-t border-border bg-surface-raised/40 flex items-center justify-end gap-3">{footer}</div>}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
