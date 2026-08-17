import React, { useState } from 'react';
import { Play, Users, ShieldAlert, HardHat, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

export function DemoScenariosToolbar({ onTriggerScenario }) {
  const [activeTrigger, setActiveTrigger] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const scenarios = [
    {
      id: 'A',
      title: 'Scenario A: Crowd Surge',
      description: 'Platform 3 · Density 87% · Surge Alert',
      icon: Users,
      badge: 'CROWD',
      badgeColor: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    },
    {
      id: 'B',
      title: 'Scenario B: Track Intrusion',
      description: 'CAM-07 · Restricted Zone · 94% Conf',
      icon: ShieldAlert,
      badge: 'SECURITY',
      badgeColor: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
    },
    {
      id: 'C',
      title: 'Scenario C: PPE Safety Violation',
      description: 'CAM-18 · No Helmet · 91% Conf',
      icon: HardHat,
      badge: 'WORKER SAFETY',
      badgeColor: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    },
    {
      id: 'D',
      title: 'Scenario D: Worksite Update',
      description: 'Maintenance Area · 8 Workers · 94% PPE',
      icon: Sparkles,
      badge: 'WORKSITE',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    },
  ];

  const handleTrigger = async (sc) => {
    setActiveTrigger(sc.id);
    try {
      if (onTriggerScenario) {
        await onTriggerScenario(sc.id);
      }
      setToastMessage({
        title: `${sc.title} Executed`,
        detail: `Dispatched to FastAPI backend, database, and WebSocket broadcast channels.`,
      });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Scenario trigger error:', err);
    } finally {
      setActiveTrigger(null);
    }
  };

  return (
    <div className="p-4 bg-surface rounded-xl border border-border shadow-xs space-y-3 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-accent fill-accent" />
          <h2 className="text-xs font-bold text-text-primary uppercase tracking-wider">
            CONTROLLED DEMO DETECTION SCENARIOS
          </h2>
        </div>
        <span className="text-[10px] font-mono text-text-muted">
          Runs through full Backend & WebSocket Pipeline
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isRunning = activeTrigger === sc.id;

          return (
            <button
              key={sc.id}
              onClick={() => handleTrigger(sc)}
              disabled={isRunning}
              className={cn(
                'p-3 rounded-xl border bg-surface-raised hover:bg-surface-hover text-left transition-all space-y-1.5 group border-border hover:border-accent/40 shadow-2xs',
                isRunning && 'opacity-60 pointer-events-none'
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded uppercase border font-mono', sc.badgeColor)}>
                  {sc.badge}
                </span>
                <Icon className="w-3.5 h-3.5 text-text-muted group-hover:text-accent transition-colors" />
              </div>

              <div className="text-xs font-bold text-text-primary group-hover:text-accent transition-colors">
                {sc.title}
              </div>

              <div className="text-[11px] text-text-muted truncate">
                {sc.description}
              </div>

              <div className="pt-1 flex items-center gap-1 text-[10px] text-accent font-semibold">
                <Play className="w-2.5 h-2.5 fill-accent" />
                <span>{isRunning ? 'Dispatched...' : 'Trigger Scenario'}</span>
              </div>
            </button>
          );
        })}
      </div>

      {toastMessage && (
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <div>
              <strong>{toastMessage.title}:</strong> {toastMessage.detail}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
