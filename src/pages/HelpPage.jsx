import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { HelpCircle, Keyboard, ShieldAlert, Phone } from 'lucide-react';

export function HelpPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="p-4 rg-card bg-surface border-border">
        <h1 className="text-base font-semibold text-text-primary">Control Room Operating Manual & Help</h1>
        <p className="text-xs text-text-muted">Standard Operating Procedures (SOP), keyboard shortcuts, and emergency protocols</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-accent" />
            <span>Keyboard Navigation Shortcuts</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex justify-between py-1.5 border-b border-border/50">
            <span className="text-text-secondary">Focus Command Search Bar</span>
            <kbd className="px-1.5 py-0.5 font-mono bg-canvas border border-border rounded text-[10px]">
              /
            </kbd>
          </div>
          <div className="flex justify-between py-1.5 border-b border-border/50">
            <span className="text-text-secondary">Close Active Modal / Drawer</span>
            <kbd className="px-1.5 py-0.5 font-mono bg-canvas border border-border rounded text-[10px]">
              Escape
            </kbd>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Phone className="w-4 h-4 text-rose-600" />
            <span>Emergency RPF Control Desk Hotlines</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-border/50">
            <span className="text-text-secondary">Railway Protection Force (RPF) Helpline</span>
            <span className="font-mono font-bold text-rose-700 dark:text-rose-400">139</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-text-secondary">Central Control Room (Divisional Master)</span>
            <span className="font-mono font-bold text-text-primary">+91 22 2262 0123</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default HelpPage;
