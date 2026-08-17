import React from 'react';
import { cn } from '../../utils/cn';
import { DEMO_SCENARIOS } from '../../data/mockLiveMonitoringData';
import { Play } from 'lucide-react';

const SCENARIO_KEYS = Object.keys(DEMO_SCENARIOS);

export function DemoScenarioSelector({ activeScenario, onSelectScenario, className }) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mr-1 flex items-center gap-1">
        <Play className="w-3 h-3" />
        Demo
      </span>
      {SCENARIO_KEYS.map((key) => {
        const scenario = DEMO_SCENARIOS[key];
        const isActive = activeScenario === key;
        const isCritical = key === 'trackIntrusion' || key === 'emergency';

        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelectScenario(key)}
            aria-label={`Demo scenario: ${scenario.label}`}
            aria-pressed={isActive}
            className={cn(
              'px-2 py-1 text-[10px] font-semibold rounded border transition-colors whitespace-nowrap',
              isActive
                ? isCritical
                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
                  : 'bg-accent-soft text-accent border-accent-border'
                : 'bg-canvas text-text-muted border-border hover:text-text-primary hover:border-border-strong'
            )}
          >
            {scenario.label}
          </button>
        );
      })}
    </div>
  );
}
