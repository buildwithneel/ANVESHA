import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { MetricCard } from '../components/ui/MetricCard';
import { SituationMap } from '../components/dashboard/SituationMap';
import { CrowdTrendChart } from '../components/dashboard/CrowdTrendChart';
import { MapPin, ShieldAlert, Users, Layers, Camera, Activity, Radio, Eye } from 'lucide-react';
import {
  stationZonesData,
  dashboardPlatforms,
  zoneCrowdTrends,
  zonePredictions,
  stationCamerasList,
} from '../data/mockDashboardData';
import { crowdService } from '../services/crowdService';
import { webSocketService } from '../services/websocket';
import { cn } from '../utils/cn';

export function StationMapPage() {
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
        console.warn('StationMap load error:', e);
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

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rg-card bg-surface border-border">
        <div>
          <h1 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <MapPin className="w-4 h-4 text-accent" />
            Station Spatial GIS Layout & Crowd Intelligence
          </h1>
          <p className="text-xs text-text-muted">
            11 Monitored Station Zones · 24 High-Definition CCTV Stream Feeds · Heatmap & AI Flow Analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-text-muted">Status:</span>
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            GIS SPATIAL ENGINE ONLINE
          </span>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Monitored Zones"
          value="11 Zones"
          subtitle="Platforms, Concourse, FOB, Gates"
          icon={Layers}
          status="normal"
        />
        <MetricCard
          title="CCTV GIS Nodes"
          value="24 Cameras"
          subtitle="100% Optical Online"
          icon={Camera}
          status="normal"
        />
        <MetricCard
          title="Peak Zone Density"
          value="91% · PF-3"
          subtitle="Gujarat Mail Boarding Surge"
          icon={Activity}
          status="attention"
        />
        <MetricCard
          title="Active Hotspot Alerts"
          value="2 High Alerts"
          subtitle="PF 3 & Main FOB 1"
          icon={ShieldAlert}
          status="critical"
        />
      </div>

      {/* Zone Quick Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {zones.map((z) => {
          const isSelected = selectedZoneId === z.id;
          return (
            <button
              key={z.id}
              type="button"
              onClick={() => setSelectedZoneId(z.id)}
              className={cn(
                'px-3 py-1.5 rounded-md font-semibold whitespace-nowrap transition-colors border flex items-center gap-1.5',
                isSelected
                  ? 'bg-accent text-white border-accent'
                  : 'bg-surface hover:bg-surface-hover text-text-secondary border-border'
              )}
            >
              <span>{z.name}</span>
              <span
                className={cn(
                  'text-[10px] font-mono px-1 rounded',
                  isSelected ? 'bg-white/20 text-white' : 'bg-canvas text-text-muted'
                )}
              >
                {z.crowd_percentage}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive Map */}
      <SituationMap
        platforms={platforms}
        zones={zones}
        selectedZoneId={selectedZoneId}
        onSelectZone={(zid) => setSelectedZoneId(zid)}
      />

      {/* Time-Series Trend & Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CrowdTrendChart
          trendData={activeTrend}
          prediction={activePrediction}
          zoneName={activeZone?.name || 'Platform 3'}
        />

        {/* Assigned Cameras in Active Zone Card */}
        <Card className="p-4 space-y-3">
          <CardHeader className="p-0 flex flex-row items-center justify-between border-b border-border pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Camera className="w-4 h-4 text-accent" />
              CCTV Cameras Assigned to {activeZone?.name}
            </CardTitle>
            <span className="text-[11px] font-mono text-text-muted">
              {activeZone?.cameras?.length || 1} Camera Units
            </span>
          </CardHeader>

          <div className="space-y-2 pt-1">
            {stationCamerasList
              .filter((c) => c.zoneId === selectedZoneId || c.zone === activeZone?.name)
              .map((cam) => (
                <div
                  key={cam.id}
                  className="p-2.5 rounded bg-canvas border border-border flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-text-primary">{cam.id}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                        {cam.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted">{cam.location}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-accent bg-accent-soft px-1.5 py-0.5 rounded">
                      AI Active
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default StationMapPage;
