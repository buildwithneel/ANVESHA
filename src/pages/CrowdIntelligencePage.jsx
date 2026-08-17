import React, { useState, useEffect } from 'react';
import { MetricCard } from '../components/ui/MetricCard';
import { DataTable } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { SituationMap } from '../components/dashboard/SituationMap';
import { CrowdTrendChart } from '../components/dashboard/CrowdTrendChart';
import { Users, TrendingUp, AlertTriangle, ShieldAlert, Layers, Activity, Eye } from 'lucide-react';
import {
  stationZonesData,
  dashboardPlatforms,
  zoneCrowdTrends,
  zonePredictions,
} from '../data/mockDashboardData';
import { crowdService } from '../services/crowdService';
import { webSocketService } from '../services/websocket';
import { cn } from '../utils/cn';

export function CrowdIntelligencePage() {
  const [selectedZoneId, setSelectedZoneId] = useState('PF-3');
  const [zones, setZones] = useState(stationZonesData);
  const [platforms, setPlatforms] = useState(dashboardPlatforms);

  useEffect(() => {
    let isMounted = true;
    async function loadCrowd() {
      try {
        const live = await crowdService.getStationCrowd();
        if (isMounted && live) {
          if (live.zones?.length) setZones(live.zones);
          if (live.platforms?.length) setPlatforms(live.platforms);
        }
      } catch (e) {
        console.warn('CrowdIntelligence load error:', e);
      }
    }
    loadCrowd();

    const unsub = webSocketService.subscribe('crowd_updated', (payload) => {
      if (payload?.station_summary?.zones) {
        setZones(payload.station_summary.zones);
      }
      if (payload?.station_summary?.platforms) {
        setPlatforms(payload.station_summary.platforms);
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  const activeZone = zones.find((z) => z.id === selectedZoneId) || zones[0];
  const activeTrend = zoneCrowdTrends[selectedZoneId] || zoneCrowdTrends['PF-3'];
  const activePrediction = zonePredictions[selectedZoneId] || zonePredictions['PF-3'];

  const zoneColumns = [
    { header: 'Zone ID', accessorKey: 'id', className: 'font-mono font-bold text-accent' },
    { header: 'Zone Name', accessorKey: 'name', className: 'font-semibold' },
    { header: 'Category', accessorKey: 'category', className: 'text-text-muted text-xs' },
    {
      header: 'Crowd %',
      accessorKey: 'crowd_percentage',
      cell: (row) => {
        const pct = row.crowd_percentage;
        let color = 'text-emerald-700 dark:text-emerald-400';
        if (pct >= 80) color = 'text-rose-700 dark:text-rose-400 font-bold';
        else if (pct >= 60) color = 'text-amber-700 dark:text-amber-400 font-bold';
        return <span className={cn('font-mono font-bold', color)}>{pct}%</span>;
      },
    },
    { header: 'Est. People', accessorKey: 'people_count', className: 'font-mono' },
    { header: 'Capacity', accessorKey: 'capacity', className: 'font-mono text-text-muted' },
    {
      header: 'Risk Classification',
      cell: (row) => {
        const pct = row.crowd_percentage;
        let sev = 'LOW';
        let label = 'NORMAL';
        if (pct >= 80) {
          sev = 'HIGH';
          label = 'HIGH';
        } else if (pct >= 60) {
          sev = 'MODERATE';
          label = 'MODERATE';
        }
        return (
          <div className="flex items-center gap-1.5">
            <StatusBadge severity={sev} size="sm" />
            <span className="font-mono text-xs font-bold">{label}</span>
          </div>
        );
      },
    },
    {
      header: 'Cameras',
      cell: (row) => <span className="font-mono text-xs">{row.cameras?.length || row.camera_count || 1} Cams</span>,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <Button
          variant={selectedZoneId === row.id ? 'primary' : 'outline'}
          size="sm"
          className="text-xs h-7 px-2"
          onClick={() => setSelectedZoneId(row.id)}
        >
          {selectedZoneId === row.id ? 'Selected' : 'Inspect Zone'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">
      {/* Page Header */}
      <div className="p-4 rg-card bg-surface border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            Crowd Intelligence & Spatial Footfall Analytics
          </h1>
          <p className="text-xs text-text-muted">
            Continuous passenger density monitoring, surge vectors, and ML flow projections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-text-muted">Threshold Logic:</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border">
            &lt;60 Normal · 60-79 Moderate · &gt;=80 High
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Station Composite Risk"
          value="82 / 100"
          subtitle="Peak Hotspot: Platform 3"
          icon={AlertTriangle}
          status="critical"
        />
        <MetricCard
          title="Total Estimated Footfall"
          value="2,430 People"
          subtitle="Station Capacity: 4,500 pax"
          icon={Users}
          status="normal"
        />
        <MetricCard
          title="Surge Vector"
          value="+14% / 10 min"
          subtitle="Platform 3 Boarding Surge"
          icon={TrendingUp}
          status="attention"
        />
      </div>

      {/* Interactive Map & Trend Chart */}
      <div className="space-y-4">
        <SituationMap
          platforms={platforms}
          zones={zones}
          selectedZoneId={selectedZoneId}
          onSelectZone={(zid) => setSelectedZoneId(zid)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6">
            <CrowdTrendChart
              trendData={activeTrend}
              prediction={activePrediction}
              zoneName={activeZone?.name || 'Platform 3'}
            />
          </div>

          <div className="lg:col-span-6">
            <Card className="p-4 space-y-3 h-full flex flex-col justify-between">
              <div>
                <CardHeader className="p-0 border-b border-border pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-accent" />
                    Operational Crowd Management SOP
                  </CardTitle>
                  <span className="text-[10px] font-mono text-text-muted">Standard Operating Procedure</span>
                </CardHeader>

                <div className="space-y-2.5 pt-3 text-xs text-text-secondary leading-relaxed">
                  <div className="p-2.5 rounded bg-canvas border border-border/80 space-y-1">
                    <div className="font-bold text-text-primary flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Normal Density (0–59%):
                    </div>
                    <p className="text-[11px] text-text-muted pl-3">
                      Standard CCTV tracking. Periodic optical sweep every 15 minutes.
                    </p>
                  </div>

                  <div className="p-2.5 rounded bg-canvas border border-border/80 space-y-1">
                    <div className="font-bold text-text-primary flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Moderate Surge (60–79%):
                    </div>
                    <p className="text-[11px] text-text-muted pl-3">
                      Elevate CCTV FPS to 30. Prepare crowd diversion announcements on station PA system.
                    </p>
                  </div>

                  <div className="p-2.5 rounded bg-canvas border border-border/80 space-y-1">
                    <div className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      High Density (80–100%):
                    </div>
                    <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80 pl-3">
                      Immediate Operational Alert triggered with 60s cooldown deduplication. Deploy RPF platform marshals.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-text-muted font-mono">
                <span>Active Model: CrowdFlowNet-v2.4</span>
                <span>Latency: 45ms</span>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* 11 Zone Density Matrix Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent" />
            11-Zone Station Density Matrix
          </h3>
          <span className="text-xs text-text-muted font-mono">Real-time DB Synchronization</span>
        </div>

        <DataTable columns={zoneColumns} data={zones} />
      </div>
    </div>
  );
}

export default CrowdIntelligencePage;
