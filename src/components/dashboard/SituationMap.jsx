import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { cn } from '../../utils/cn';
import {
  MapPin,
  Camera,
  ShieldAlert,
  Users,
  Layers,
  Activity,
  Eye,
  SlidersHorizontal,
  X,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { stationCamerasList, stationZonesData } from '../../data/mockDashboardData';

const DENSITY_THEMES = {
  NORMAL: {
    badge: 'NORMAL',
    risk: 'LOW',
    fill: '#22C55E',
    stroke: '#16A34A',
    bg: 'rgba(34, 197, 94, 0.12)',
    heatmap: 'rgba(34, 197, 94, 0.28)',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  },
  MODERATE: {
    badge: 'MODERATE',
    risk: 'MODERATE',
    fill: '#F59E0B',
    stroke: '#D97706',
    bg: 'rgba(245, 158, 11, 0.15)',
    heatmap: 'rgba(245, 158, 11, 0.32)',
    textClass: 'text-amber-700 dark:text-amber-400',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  },
  HIGH: {
    badge: 'HIGH',
    risk: 'HIGH',
    fill: '#EF4444',
    stroke: '#DC2626',
    bg: 'rgba(239, 68, 68, 0.18)',
    heatmap: 'rgba(239, 68, 68, 0.38)',
    textClass: 'text-rose-700 dark:text-rose-400',
    badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
  },
};

function getDensityConfig(percentage) {
  if (percentage >= 80) return DENSITY_THEMES.HIGH;
  if (percentage >= 60) return DENSITY_THEMES.MODERATE;
  return DENSITY_THEMES.NORMAL;
}

export function SituationMap({
  platforms = [],
  zones = stationZonesData,
  selectedZoneId = 'PF-3',
  onSelectZone = () => {},
  onViewCameras = null,
  onViewAlerts = null,
}) {
  const navigate = useNavigate();
  const [heatmapMode, setHeatmapMode] = useState(true);
  const [selectedCamera, setSelectedCamera] = useState(null);

  // Map of zone data keyed by id
  const zoneMap = React.useMemo(() => {
    const map = {};
    zones.forEach((z) => {
      map[z.id] = z;
    });
    // Ensure platforms overlay
    platforms.forEach((p) => {
      if (map[p.id]) {
        map[p.id] = {
          ...map[p.id],
          crowd_percentage: p.occupancy || p.crowd_percentage || map[p.id].crowd_percentage,
          people_count: p.people_count || map[p.id].people_count,
        };
      }
    });
    return map;
  }, [zones, platforms]);

  const activeZone = zoneMap[selectedZoneId] || zoneMap['PF-3'] || zones[0];
  const activeDensityConfig = getDensityConfig(activeZone?.crowd_percentage || 50);

  // Zone coordinates inside 720 x 300 SVG coordinate space
  // 11 Zones:
  // PF-1, PF-2, PF-3, PF-4 (left platforms)
  // TRACK (right tracks)
  // CONCOURSE (top)
  // ENTRY (top-left)
  // EXIT (top-right)
  // FOB (vertical span)
  // WAITING (below concourse left)
  // PARKING (bottom left)
  const zoneGeometry = {
    ENTRY: { x: 30, y: 15, width: 85, height: 38, label: 'ENTRY' },
    CONCOURSE: { x: 125, y: 15, width: 440, height: 38, label: 'MAIN CONCOURSE' },
    EXIT: { x: 575, y: 15, width: 115, height: 38, label: 'EXIT GATE' },
    WAITING: { x: 30, y: 62, width: 105, height: 32, label: 'WAITING AREA' },
    'PF-1': { x: 145, y: 62, width: 230, height: 30, label: 'Platform 1' },
    'PF-2': { x: 145, y: 100, width: 230, height: 30, label: 'Platform 2' },
    'PF-3': { x: 145, y: 138, width: 230, height: 30, label: 'Platform 3' },
    'PF-4': { x: 145, y: 176, width: 230, height: 30, label: 'Platform 4' },
    FOB: { x: 385, y: 56, width: 34, height: 160, label: 'FOB' },
    TRACK: { x: 430, y: 62, width: 260, height: 144, label: 'TRACK AREA' },
    PARKING: { x: 30, y: 104, width: 105, height: 102, label: 'PARKING & TAXI' },
  };

  // Camera Marker Positions on SVG canvas
  const cameraMarkers = [
    { id: 'CAM-01', x: 160, y: 77, zoneId: 'PF-1' },
    { id: 'CAM-02', x: 250, y: 77, zoneId: 'PF-1' },
    { id: 'CAM-03', x: 75, y: 78, zoneId: 'WAITING' },
    { id: 'CAM-04', x: 160, y: 115, zoneId: 'PF-2' },
    { id: 'CAM-05', x: 250, y: 115, zoneId: 'PF-2' },
    { id: 'CAM-06', x: 340, y: 115, zoneId: 'PF-2' },
    { id: 'CAM-07', x: 160, y: 153, zoneId: 'PF-3' },
    { id: 'CAM-08', x: 250, y: 153, zoneId: 'PF-3' },
    { id: 'CAM-09', x: 340, y: 153, zoneId: 'PF-3' },
    { id: 'CAM-10', x: 160, y: 191, zoneId: 'PF-4' },
    { id: 'CAM-11', x: 250, y: 191, zoneId: 'PF-4' },
    { id: 'CAM-12', x: 340, y: 191, zoneId: 'PF-4' },
    { id: 'CAM-16', x: 402, y: 85, zoneId: 'FOB' },
    { id: 'CAM-17', x: 402, y: 135, zoneId: 'FOB' },
    { id: 'CAM-18', x: 402, y: 185, zoneId: 'FOB' },
    { id: 'CAM-19', x: 500, y: 100, zoneId: 'TRACK' },
    { id: 'CAM-20', x: 620, y: 160, zoneId: 'TRACK' },
    { id: 'CAM-21', x: 345, y: 34, zoneId: 'CONCOURSE' },
    { id: 'CAM-22', x: 70, y: 34, zoneId: 'ENTRY' },
    { id: 'CAM-23', x: 630, y: 34, zoneId: 'EXIT' },
    { id: 'CAM-24', x: 75, y: 150, zoneId: 'PARKING' },
  ];

  const handleCameraClick = (e, camId) => {
    e.stopPropagation();
    const cam = stationCamerasList.find((c) => c.id === camId) || {
      id: camId,
      location: `Camera ${camId}`,
      status: 'ONLINE',
      aiStatus: 'ACTIVE',
      alerts: 0,
      zone: activeZone?.name || 'Station',
    };
    setSelectedCamera(cam);
  };

  const handleNavigateToLiveFeed = (camId) => {
    navigate('/live-monitoring', {
      state: { cameraId: camId, autoPlay: true },
    });
  };

  const handleViewCamerasAction = () => {
    if (onViewCameras) {
      onViewCameras(activeZone);
    } else {
      navigate('/system-cameras', { state: { zoneFilter: activeZone?.name || activeZone?.id } });
    }
  };

  const handleViewAlertsAction = () => {
    if (onViewAlerts) {
      onViewAlerts(activeZone);
    } else {
      navigate('/alerts', { state: { zoneFilter: activeZone?.name || activeZone?.id } });
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-accent" />
          <CardTitle className="text-sm">Interactive Station Overview & Spatial GIS</CardTitle>
          <span className="text-[11px] font-mono text-text-muted hidden md:inline">
            11 Zones Monitored
          </span>
        </div>

        {/* Heatmap & View Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHeatmapMode(!heatmapMode)}
            className={cn(
              'px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors border',
              heatmapMode
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                : 'bg-surface hover:bg-surface-hover text-text-secondary border-border'
            )}
            title="Toggle Crowd Density Heatmap Overlay"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Heatmap Overlay: {heatmapMode ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Main SVG Station Map Area (col-span-8) */}
          <div className="lg:col-span-8 p-3 bg-canvas/40 dark:bg-canvas/60 relative select-none">
            <div className="w-full aspect-[2.3/1] bg-surface/50 dark:bg-surface-raised/40 border border-border rounded-md overflow-hidden relative shadow-inner">
              <svg
                viewBox="0 0 720 230"
                className="w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="Interactive Station Overview Map"
              >
                {/* Background Grid */}
                <defs>
                  <pattern id="station-grid" width="16" height="16" patternUnits="userSpaceOnUse">
                    <path d="M 16 0 L 0 0 0 16" fill="none" className="stroke-border/40" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="720" height="230" fill="url(#station-grid)" />

                {/* ── Render 11 Interactive Zones ─────────────────────── */}
                {Object.entries(zoneGeometry).map(([zId, geo]) => {
                  const zData = zoneMap[zId] || { crowd_percentage: 45, density_label: 'NORMAL' };
                  const isSelected = selectedZoneId === zId;
                  const densityCfg = getDensityConfig(zData.crowd_percentage);

                  let fillColor = heatmapMode ? densityCfg.heatmap : densityCfg.bg;
                  let strokeColor = isSelected ? '#3B82F6' : densityCfg.stroke;
                  let strokeW = isSelected ? 2.5 : 1;

                  return (
                    <g
                      key={zId}
                      onClick={() => onSelectZone(zId)}
                      className="cursor-pointer transition-all duration-200 group"
                      tabIndex={0}
                      role="button"
                      aria-label={`${geo.label}: ${zData.crowd_percentage}% crowd`}
                      onKeyDown={(e) => e.key === 'Enter' && onSelectZone(zId)}
                    >
                      {/* Zone Base Rectangle */}
                      <rect
                        x={geo.x}
                        y={geo.y}
                        width={geo.width}
                        height={geo.height}
                        rx="4"
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={strokeW}
                        strokeDasharray={zId === 'FOB' ? '4 2' : undefined}
                        className={cn(
                          'transition-all duration-200',
                          isSelected ? 'filter drop-shadow(0 0 6px rgba(59, 130, 246, 0.4))' : 'hover:opacity-90'
                        )}
                      />

                      {/* Zone Text Label */}
                      <text
                        x={geo.x + (zId === 'FOB' ? geo.width / 2 : 10)}
                        y={geo.y + (zId === 'FOB' ? geo.height / 2 : 18)}
                        textAnchor={zId === 'FOB' ? 'middle' : 'start'}
                        transform={zId === 'FOB' ? `rotate(-90, ${geo.x + geo.width / 2}, ${geo.y + geo.height / 2})` : undefined}
                        className={cn(
                          'font-semibold select-none pointer-events-none',
                          isSelected ? 'fill-blue-700 dark:fill-blue-300 font-bold' : 'fill-text-primary'
                        )}
                        style={{ fontSize: zId.startsWith('PF') ? '11px' : '9.5px' }}
                      >
                        {geo.label}
                      </text>

                      {/* Zone Percentage Badge (Text Label + Density) */}
                      {zId !== 'FOB' && (
                        <text
                          x={geo.x + geo.width - 8}
                          y={geo.y + 18}
                          textAnchor="end"
                          fill={densityCfg.fill}
                          className="font-mono font-bold select-none pointer-events-none"
                          style={{ fontSize: '10px' }}
                        >
                          {zData.crowd_percentage}% ({densityCfg.badge})
                        </text>
                      )}

                      {/* Active Incident Warning Indicator for High Risk */}
                      {zData.crowd_percentage >= 80 && (
                        <g transform={`translate(${geo.x + geo.width - 24}, ${geo.y + geo.height - 10})`}>
                          <circle cx="0" cy="0" r="4" fill="#EF4444" className="animate-pulse" />
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Track Area Railway Rails Lines */}
                <line x1="435" y1="78" x2="685" y2="78" stroke="#94A3B8" strokeWidth="2" strokeDasharray="8 4" opacity="0.4" />
                <line x1="435" y1="116" x2="685" y2="116" stroke="#94A3B8" strokeWidth="2" strokeDasharray="8 4" opacity="0.4" />
                <line x1="435" y1="154" x2="685" y2="154" stroke="#94A3B8" strokeWidth="2" strokeDasharray="8 4" opacity="0.4" />
                <line x1="435" y1="192" x2="685" y2="192" stroke="#94A3B8" strokeWidth="2" strokeDasharray="8 4" opacity="0.4" />

                {/* Track labels */}
                <text x="680" y="74" textAnchor="end" className="fill-text-muted text-[8px] font-mono select-none pointer-events-none">Track 1</text>
                <text x="680" y="112" textAnchor="end" className="fill-text-muted text-[8px] font-mono select-none pointer-events-none">Track 2</text>
                <text x="680" y="150" textAnchor="end" className="fill-text-muted text-[8px] font-mono select-none pointer-events-none">Track 3</text>
                <text x="680" y="188" textAnchor="end" className="fill-text-muted text-[8px] font-mono select-none pointer-events-none">Track 4</text>

                {/* ── Camera Markers ──────────────────────────────────── */}
                {cameraMarkers.map((cam) => {
                  const isHovered = selectedCamera?.id === cam.id;
                  const isSelectedZone = cam.zoneId === selectedZoneId;

                  return (
                    <g
                      key={cam.id}
                      onClick={(e) => handleCameraClick(e, cam.id)}
                      className="cursor-pointer group"
                      tabIndex={0}
                      role="button"
                      aria-label={`Camera ${cam.id}`}
                    >
                      {/* Outer pulse when selected zone */}
                      {isSelectedZone && (
                        <circle
                          cx={cam.x}
                          cy={cam.y}
                          r="9"
                          fill="rgba(59, 130, 246, 0.25)"
                          className="animate-ping"
                          style={{ transformOrigin: `${cam.x}px ${cam.y}px` }}
                        />
                      )}

                      {/* Camera Dot */}
                      <circle
                        cx={cam.x}
                        cy={cam.y}
                        r="6"
                        fill={isHovered ? '#2563EB' : isSelectedZone ? '#3B82F6' : '#475569'}
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                        className="transition-all duration-150 shadow-md"
                      />

                      {/* Camera Icon glyph */}
                      <circle cx={cam.x} cy={cam.y} r="2" fill="#FFFFFF" />

                      {/* Tiny camera ID label */}
                      <text
                        x={cam.x}
                        y={cam.y + 11}
                        textAnchor="middle"
                        className="fill-text-muted font-mono font-bold select-none pointer-events-none"
                        style={{ fontSize: '6.5px' }}
                      >
                        {cam.id}
                      </text>
                    </g>
                  );
                })}

                {/* Legend Overlay at Bottom Right */}
                <g transform="translate(420, 218)">
                  <rect x="-8" y="-10" width="285" height="18" rx="3" className="fill-surface/90 stroke-border" strokeWidth="0.5" />
                  {/* Normal */}
                  <circle cx="0" cy="0" r="3.5" fill="#22C55E" />
                  <text x="7" y="3" className="fill-text-secondary text-[8px] font-medium">0–59% NORMAL (LOW)</text>
                  {/* Moderate */}
                  <circle cx="95" cy="0" r="3.5" fill="#F59E0B" />
                  <text x="102" y="3" className="fill-text-secondary text-[8px] font-medium">60–79% MODERATE</text>
                  {/* High */}
                  <circle cx="190" cy="0" r="3.5" fill="#EF4444" />
                  <text x="197" y="3" className="fill-text-secondary text-[8px] font-medium">80–100% HIGH</text>
                </g>
              </svg>

              {/* Floating Camera Popover if a camera is selected */}
              {selectedCamera && (
                <div className="absolute bottom-3 left-3 bg-surface border border-border shadow-xl rounded-lg p-3 w-64 text-xs space-y-2 z-20 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-1 border-b border-border">
                    <div className="flex items-center gap-1.5 font-bold font-mono text-text-primary">
                      <Camera className="w-3.5 h-3.5 text-accent" />
                      <span>{selectedCamera.id}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCamera(null)}
                      className="p-1 hover:bg-surface-hover rounded text-text-muted hover:text-text-primary"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Location:</span>
                      <span className="font-medium text-text-primary text-right">{selectedCamera.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Operational:</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400 font-mono">{selectedCamera.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">AI Detection:</span>
                      <span className="font-semibold text-accent font-mono">{selectedCamera.aiStatus || 'ACTIVE'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Active Alerts:</span>
                      <span className={cn('font-bold font-mono', selectedCamera.alerts > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-text-primary')}>
                        {selectedCamera.alerts || 0}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-center text-xs mt-1"
                    onClick={() => handleNavigateToLiveFeed(selectedCamera.id)}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    View Live Feed
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* ── Selected Zone Detail Panel (col-span-4) ──────────── */}
          <div className="lg:col-span-4 p-4 bg-surface border-t lg:border-t-0 lg:border-l border-border flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              {/* Header with Zone Name & Category */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                    Selected Zone Intel
                  </span>
                  <h3 className="text-base font-bold text-text-primary flex items-center gap-1.5">
                    {activeZone?.name || 'Platform 3'}
                  </h3>
                </div>

                <div className={cn('px-2.5 py-0.5 rounded text-xs font-bold font-mono border', activeDensityConfig.badgeClass)}>
                  {activeDensityConfig.badge} RISK
                </div>
              </div>

              {/* Occupancy and Count Metrics */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-md bg-canvas border border-border/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-text-muted">
                    <span>Crowd Density</span>
                    <Activity className="w-3 h-3 text-accent" />
                  </div>
                  <div className={cn('text-2xl font-black font-mono tracking-tight', activeDensityConfig.textClass)}>
                    {activeZone?.crowd_percentage || 91}%
                  </div>
                  <div className="text-[10px] text-text-muted font-medium">
                    Status: <strong className={activeDensityConfig.textClass}>{activeDensityConfig.badge}</strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-md bg-canvas border border-border/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-text-muted">
                    <span>People Count</span>
                    <Users className="w-3 h-3 text-text-muted" />
                  </div>
                  <div className="text-2xl font-black font-mono text-text-primary">
                    {activeZone?.people_count || 428}
                  </div>
                  <div className="text-[10px] text-text-muted font-mono">
                    Cap: {activeZone?.capacity || 500} pax
                  </div>
                </div>
              </div>

              {/* Key Zone Properties */}
              <div className="space-y-1.5 text-xs bg-canvas/50 border border-border/60 rounded-md p-2.5">
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-text-muted flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-text-muted" />
                    Covering Cameras:
                  </span>
                  <span className="font-bold font-mono text-text-primary">
                    {activeZone?.camera_count || activeZone?.cameras?.length || 3} Units
                  </span>
                </div>

                <div className="flex items-center justify-between py-0.5">
                  <span className="text-text-muted flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    Active Alerts:
                  </span>
                  <span className={cn('font-bold font-mono', (activeZone?.active_alerts_count || 0) > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-text-primary')}>
                    {activeZone?.active_alerts_count ?? 2}
                  </span>
                </div>

                {activeZone?.train_info && (
                  <div className="pt-1.5 border-t border-border/40 text-[11px] text-text-secondary leading-snug">
                    <span className="text-[10px] font-semibold text-text-muted uppercase block">Train Movement:</span>
                    {activeZone.train_info}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Buttons */}
            <div className="flex gap-2 pt-2 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 justify-center text-xs"
                onClick={handleViewCamerasAction}
              >
                <Camera className="w-3.5 h-3.5 mr-1" />
                View Cameras
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 justify-center text-xs"
                onClick={handleViewAlertsAction}
              >
                <ShieldAlert className="w-3.5 h-3.5 mr-1 text-rose-500" />
                View Alerts
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SituationMap;
