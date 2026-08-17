import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Keyboard, Command } from 'lucide-react';

export function ShortcutsHelpModal({ isOpen, onClose }) {
  const shortcuts = [
    { key: 'A', description: 'Acknowledge selected alert' },
    { key: 'I', description: 'Mark alert as Investigating' },
    { key: 'R', description: 'Resolve active alert or incident' },
    { key: '/', description: 'Focus Global Search bar' },
    { key: 'ESC', description: 'Close inspection panels and modals' },
    { key: '?', description: 'Display this keyboard shortcuts helper' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Operator Keyboard Shortcuts"
      description="Quick-response command shortcuts for rapid station monitoring."
      footer={
        <Button variant="primary" onClick={onClose}>
          Got it
        </Button>
      }
    >
      <div className="space-y-2.5 text-xs">
        {shortcuts.map(({ key, description }) => (
          <div
            key={key}
            className="flex items-center justify-between p-2.5 rounded-md bg-canvas border border-border"
          >
            <span className="text-text-secondary">{description}</span>
            <kbd className="px-2 py-1 font-mono text-xs font-bold text-text-primary bg-surface border border-border rounded shadow-xs">
              {key}
            </kbd>
          </div>
        ))}
        <p className="text-[11px] text-text-muted pt-2 text-center">
          Shortcuts are active when not typing inside input or text fields.
        </p>
      </div>
    </Modal>
  );
}

export default ShortcutsHelpModal;
