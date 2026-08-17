import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FileText, Download, Printer } from 'lucide-react';

export function ReportsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rg-card bg-surface border-border">
        <div>
          <h1 className="text-base font-semibold text-text-primary">Shift & Safety Incident Reports</h1>
          <p className="text-xs text-text-muted">Generate compliance shift logs, safety audit reports, and RPF incident export summaries</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Printer}>Print Shift Log</Button>
          <Button variant="primary" size="sm" icon={Download}>Export PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-accent">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-semibold text-text-primary">Daily Safety Audit Summary</span>
          </div>
          <p className="text-xs text-text-muted">Includes all critical track intrusion and fallen person events logged over the past 24 hours.</p>
        </Card>
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-accent">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-semibold text-text-primary">Worker PPE Compliance Log</span>
          </div>
          <p className="text-xs text-text-muted">Detailed log of yard maintenance permits and safety gear non-compliance alerts.</p>
        </Card>
      </div>
    </div>
  );
}

export default ReportsPage;
