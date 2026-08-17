import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Shield,
  HardHat,
  Sparkles,
  Camera,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from 'recharts';
import { getAnalyticsData } from '../services/api';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-md border border-border">
      <p className="text-text-primary font-medium mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} style={{ color: entry.color }} className="text-[11px]">
          {entry.name}: <span className="font-mono font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('24h');

  useEffect(() => {
    async function load() {
      const result = await getAnalyticsData();
      setData(result);
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 skeleton h-72" />
          <div className="skeleton h-72" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <BarChart3 size={20} className="text-accent" />
            Analytics
          </h1>
          <p className="text-sm text-text-muted mt-0.5">Station operational metrics and crowd trends</p>
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {['24h', '7d', '30d'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 text-xs font-medium transition-colors ${
                timeframe === tf
                  ? 'bg-accent-soft text-accent'
                  : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-canvas'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* ── Row 1: Crowd Trend + Incidents by Category ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Crowd Trend — 2 cols */}
        <div className="lg:col-span-2 card p-4">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
            <Users size={16} className="text-accent" />
            Crowd density trend
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.crowdTrend}>
              <defs>
                <linearGradient id="crowdGrad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="crowdGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D97706" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="crowdGrad3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E5E9" />
              <XAxis dataKey="hour" stroke="#8B95A3" fontSize={11} />
              <YAxis stroke="#8B95A3" fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="platform1" name="Platform 1" stroke="#2563EB" fill="url(#crowdGrad1)" strokeWidth={2} />
              <Area type="monotone" dataKey="platform2" name="Platform 2" stroke="#D97706" fill="url(#crowdGrad2)" strokeWidth={2} />
              <Area type="monotone" dataKey="concourse" name="Concourse" stroke="#16A34A" fill="url(#crowdGrad3)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Incidents by Category — 1 col */}
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
            <Shield size={16} className="text-status-critical" />
            Incidents by category
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data.incidentsByCategory}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.incidentsByCategory.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {data.incidentsByCategory.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-text-secondary">{cat.name}</span>
                </div>
                <span className="font-mono text-text-primary font-medium">{cat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 2: Risk Trend + Camera Activity ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Risk Trend */}
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-status-attention" />
            Station risk score trend
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.riskTrend}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D97706" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E5E9" />
              <XAxis dataKey="hour" stroke="#8B95A3" fontSize={11} />
              <YAxis stroke="#8B95A3" fontSize={11} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="score" name="Risk Score" stroke="#D97706" fill="url(#riskGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Camera Activity */}
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
            <Camera size={16} className="text-status-normal" />
            Camera status overview
          </h2>
          <div className="flex items-center justify-center gap-8 pt-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={data.cameraActivity}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.cameraActivity.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-4">
              {data.cameraActivity.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{item.value}</p>
                    <p className="text-[11px] text-text-muted">{item.name}</p>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-border">
                <p className="text-lg font-semibold text-text-primary">
                  {data.cameraActivity.reduce((sum, i) => sum + i.value, 0)}
                </p>
                <p className="text-[11px] text-text-muted">Total cameras</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: PPE Compliance + Cleanliness ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* PPE Compliance */}
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
            <HardHat size={16} className="text-accent" />
            PPE compliance by zone
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.ppeCompliance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E5E9" horizontal={false} />
              <XAxis type="number" stroke="#8B95A3" fontSize={11} domain={[0, 100]} />
              <YAxis type="category" dataKey="zone" stroke="#8B95A3" fontSize={11} width={85} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="compliance" name="Compliance %" radius={[0, 4, 4, 0]} barSize={14}>
                {data.ppeCompliance.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.compliance >= 90 ? '#16A34A' : entry.compliance >= 75 ? '#D97706' : '#DC2626'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cleanliness */}
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-status-normal" />
            Cleanliness score by zone
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.cleanliness}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E5E9" />
              <XAxis dataKey="zone" stroke="#8B95A3" fontSize={11} />
              <YAxis stroke="#8B95A3" fontSize={11} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="score" name="Cleanliness Score" radius={[4, 4, 0, 0]} barSize={24}>
                {data.cleanliness.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.score >= 80 ? '#16A34A' : entry.score >= 60 ? '#D97706' : '#DC2626'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
