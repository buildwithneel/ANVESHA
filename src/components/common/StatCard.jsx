import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, variant = 'default' }) {
  const variantStyles = {
    default: '',
    critical: 'border-l-[3px] border-l-status-critical',
    warning: 'border-l-[3px] border-l-status-attention',
    success: 'border-l-[3px] border-l-status-normal',
    info: 'border-l-[3px] border-l-accent',
  };

  const iconColors = {
    default: 'text-accent',
    critical: 'text-status-critical',
    warning: 'text-status-attention',
    success: 'text-status-normal',
    info: 'text-accent',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-status-critical' : trend === 'down' ? 'text-status-normal' : 'text-text-muted';

  return (
    <div className={`card card-hover p-4 animate-fade-in ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={`p-1.5 rounded-md bg-canvas ${iconColors[variant]}`}>
              <Icon size={16} />
            </div>
          )}
          <span className="text-xs font-medium text-text-secondary">
            {title}
          </span>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
            <TrendIcon size={12} />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-semibold text-text-primary mb-0.5">{value}</p>
      {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
    </div>
  );
}
