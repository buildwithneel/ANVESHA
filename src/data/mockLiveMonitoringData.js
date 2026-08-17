/**
 * Mock Live Monitoring Data Layer
 * Camera registry, AI detection overlays, demo scenarios, and event timeline.
 * Designed for clean replacement with FastAPI/WebSocket real-time data.
 */

// ─── Camera Registry ────────────────────────────────────────
export const monitoringCameras = [
  { id: 'CAM-01', name: 'Platform 1 · South', zone: 'Platform 1', category: 'platform', status: 'online', resolution: '1080p', fps: 30, aiEnabled: true, hasAlerts: false },
  { id: 'CAM-02', name: 'Platform 1 · North', zone: 'Platform 1', category: 'platform', status: 'online', resolution: '1080p', fps: 30, aiEnabled: true, hasAlerts: false },
  { id: 'CAM-03', name: 'Platform 2 · Central', zone: 'Platform 2', category: 'platform', status: 'online', resolution: '1080p', fps: 25, aiEnabled: true, hasAlerts: false },
  { id: 'CAM-04', name: 'Maintenance Yard · Track 2', zone: 'Yard Area', category: 'maintenance', status: 'online', resolution: '1080p', fps: 30, aiEnabled: true, hasAlerts: true },
  { id: 'CAM-05', name: 'Main Concourse · Gate A', zone: 'Concourse', category: 'concourse', status: 'online', resolution: '1080p', fps: 30, aiEnabled: true, hasAlerts: false },
  { id: 'CAM-06', name: 'Main Concourse · Gate B', zone: 'Concourse', category: 'concourse', status: 'online', resolution: '1080p', fps: 25, aiEnabled: true, hasAlerts: false },
  { id: 'CAM-07', name: 'Platform 3 · North End', zone: 'Platform 3', category: 'platform', status: 'online', resolution: '1080p', fps: 30, aiEnabled: true, hasAlerts: true },
  { id: 'CAM-08', name: 'Platform 3 · South End', zone: 'Platform 3', category: 'platform', status: 'online', resolution: '1080p', fps: 30, aiEnabled: true, hasAlerts: false },
  { id: 'CAM-09', name: 'Platform 4 · Central', zone: 'Platform 4', category: 'platform', status: 'online', resolution: '1080p', fps: 30, aiEnabled: true, hasAlerts: false },
  { id: 'CAM-10', name: 'North Entrance · Main', zone: 'North Gate', category: 'entrance', status: 'online', resolution: '1080p', fps: 30, aiEnabled: true, hasAlerts: false },
  { id: 'CAM-11', name: 'South Entrance · Parking', zone: 'South Gate', category: 'entrance', status: 'online', resolution: '720p', fps: 25, aiEnabled: false, hasAlerts: false },
  { id: 'CAM-12', name: 'FOB · Central Span', zone: 'Foot Overbridge', category: 'concourse', status: 'online', resolution: '1080p', fps: 30, aiEnabled: true, hasAlerts: true },
  { id: 'CAM-13', name: 'Platform 2 · Stairwell A', zone: 'Platform 2', category: 'platform', status: 'online', resolution: '1080p', fps: 25, aiEnabled: true, hasAlerts: false },
  { id: 'CAM-14', name: 'Yard Track · North Section', zone: 'Yard Area', category: 'track', status: 'online', resolution: '1440p', fps: 30, aiEnabled: true, hasAlerts: false },
  { id: 'CAM-15', name: 'Track Junction · Signal Box', zone: 'Track Area', category: 'track', status: 'offline', resolution: '1080p', fps: 0, aiEnabled: false, hasAlerts: false },
  { id: 'CAM-16', name: 'Waiting Hall · West Wing', zone: 'Concourse', category: 'concourse', status: 'online', resolution: '1080p', fps: 25, aiEnabled: true, hasAlerts: false },
  { id: 'CAM-17', name: 'Platform 1 · Stairwell B', zone: 'Platform 1', category: 'platform', status: 'online', resolution: '1080p', fps: 25, aiEnabled: true, hasAlerts: false },
  { id: 'CAM-18', name: 'Maintenance Workshop', zone: 'Workshop', category: 'maintenance', status: 'online', resolution: '720p', fps: 15, aiEnabled: false, hasAlerts: false },
  { id: 'CAM-19', name: 'Parcel Office', zone: 'Concourse', category: 'concourse', status: 'online', resolution: '1080p', fps: 25, aiEnabled: true, hasAlerts: false },
  { id: 'CAM-20', name: 'Ticket Counter Hall', zone: 'Concourse', category: 'concourse', status: 'online', resolution: '1080p', fps: 25, aiEnabled: true, hasAlerts: false },
  { id: 'CAM-21', name: 'Platform 4 · West End', zone: 'Platform 4', category: 'platform', status: 'online', resolution: '1080p', fps: 30, aiEnabled: true, hasAlerts: false },
  { id: 'CAM-22', name: 'East Entrance · Auto Stand', zone: 'East Gate', category: 'entrance', status: 'online', resolution: '1080p', fps: 25, aiEnabled: true, hasAlerts: false },
  { id: 'CAM-23', name: 'Yard Track · South Section', zone: 'Yard Area', category: 'track', status: 'online', resolution: '1080p', fps: 30, aiEnabled: true, hasAlerts: false },
  { id: 'CAM-24', name: 'RPF Control Room', zone: 'Control Room', category: 'concourse', status: 'online', resolution: '1080p', fps: 30, aiEnabled: false, hasAlerts: false },
];

// ─── Demo Scenarios (detection overlays + AI stats + events) ──
export const DEMO_SCENARIOS = {
  normal: {
    label: 'Normal Operation',
    description: 'Routine passenger movement with standard monitoring.',
    defaultCamera: 'CAM-05',
    detections: {
      people: 12,
      crowdDensity: 'NORMAL',
      ppeViolations: 0,
      restrictedZone: 0,
    },
    modelStatus: { status: 'online', inference: 28, threshold: 0.65 },
    boundingBoxes: [
      { id: 'bb-1', x: 15, y: 35, w: 8, h: 20, label: 'Person', confidence: 92, color: '#3B82F6' },
      { id: 'bb-2', x: 30, y: 38, w: 7, h: 18, label: 'Person', confidence: 89, color: '#3B82F6' },
      { id: 'bb-3', x: 52, y: 30, w: 8, h: 22, label: 'Person', confidence: 94, color: '#3B82F6' },
      { id: 'bb-4', x: 70, y: 40, w: 7, h: 19, label: 'Person', confidence: 87, color: '#3B82F6' },
    ],
    events: [
      { id: 'evt-n1', time: '13:38:22', type: 'info', title: 'Routine crowd flow normal', location: 'Main Concourse', severity: 'LOW' },
      { id: 'evt-n2', time: '13:35:10', type: 'info', title: 'AI model heartbeat OK', location: 'System', severity: 'INFO' },
      { id: 'evt-n3', time: '13:30:05', type: 'info', title: 'Camera CAM-15 went offline', location: 'Track Junction', severity: 'MEDIUM' },
    ],
    aiExplanation: {
      title: 'Normal operational conditions',
      confidence: null,
      observed: [
        'Passenger flow within expected patterns',
        'All monitored zones within safe occupancy thresholds',
        'No anomalous movement patterns detected',
      ],
      recommended: 'Continue standard monitoring. No action required.',
    },
  },
  crowdSurge: {
    label: 'Crowd Surge',
    description: 'Platform 3 congestion from delayed train.',
    defaultCamera: 'CAM-07',
    detections: {
      people: 47,
      crowdDensity: 'HIGH',
      ppeViolations: 0,
      restrictedZone: 0,
    },
    modelStatus: { status: 'online', inference: 34, threshold: 0.65 },
    boundingBoxes: [
      { id: 'bb-c1', x: 8, y: 25, w: 85, h: 55, label: 'Crowd', confidence: 89, color: '#F59E0B' },
      { id: 'bb-c2', x: 10, y: 30, w: 7, h: 18, label: 'Person', confidence: 91, color: '#3B82F6' },
      { id: 'bb-c3', x: 22, y: 28, w: 6, h: 16, label: 'Person', confidence: 88, color: '#3B82F6' },
      { id: 'bb-c4', x: 35, y: 32, w: 7, h: 17, label: 'Person', confidence: 94, color: '#3B82F6' },
      { id: 'bb-c5', x: 48, y: 27, w: 6, h: 15, label: 'Person', confidence: 86, color: '#3B82F6' },
      { id: 'bb-c6', x: 60, y: 35, w: 7, h: 18, label: 'Person', confidence: 90, color: '#3B82F6' },
      { id: 'bb-c7', x: 72, y: 30, w: 6, h: 16, label: 'Person', confidence: 87, color: '#3B82F6' },
    ],
    events: [
      { id: 'evt-cs1', time: '13:44:31', type: 'warning', title: 'Crowd density threshold exceeded', location: 'Platform 3', severity: 'HIGH' },
      { id: 'evt-cs2', time: '13:43:18', type: 'warning', title: 'Stairwell B flow rate at 140%', location: 'Platform 3 Stairwell', severity: 'HIGH' },
      { id: 'evt-cs3', time: '13:42:05', type: 'info', title: 'Crowd density increasing rapidly', location: 'Platform 3', severity: 'MEDIUM' },
      { id: 'evt-cs4', time: '13:40:22', type: 'info', title: 'Gujarat Mail delayed +18 min', location: 'Platform 3', severity: 'LOW' },
    ],
    aiExplanation: {
      title: 'Potential crowd surge detected',
      confidence: 89,
      observed: [
        'Crowd density on Platform 3 exceeds 5.8 persons/sqm',
        'Stairwell B passenger flow at 140% design capacity',
        'Delayed Gujarat Mail contributing to passenger accumulation',
        'Rate of density increase: +12% in last 10 minutes',
      ],
      recommended: 'Activate crowd diversion signage to Stairwell A and FOB-2. Consider temporary entry restriction at Platform 3 Gate B. Alert Station Master for alternative boarding guidance.',
    },
  },
  trackIntrusion: {
    label: 'Track Intrusion',
    description: 'Unauthorized person detected on active track.',
    defaultCamera: 'CAM-07',
    detections: {
      people: 14,
      crowdDensity: 'MODERATE',
      ppeViolations: 0,
      restrictedZone: 1,
    },
    modelStatus: { status: 'online', inference: 32, threshold: 0.65 },
    boundingBoxes: [
      { id: 'bb-t1', x: 35, y: 55, w: 12, h: 30, label: 'Person', confidence: 94, color: '#EF4444' },
      { id: 'bb-t2', x: 20, y: 50, w: 55, h: 40, label: 'Restricted Zone', confidence: 97, color: '#EF4444' },
      { id: 'bb-t3', x: 10, y: 20, w: 7, h: 18, label: 'Person', confidence: 91, color: '#3B82F6' },
      { id: 'bb-t4', x: 75, y: 25, w: 6, h: 16, label: 'Person', confidence: 88, color: '#3B82F6' },
    ],
    events: [
      { id: 'evt-ti1', time: '13:44:31', type: 'critical', title: 'Restricted zone entry detected', location: 'Platform 3 Track Area', severity: 'CRITICAL' },
      { id: 'evt-ti2', time: '13:43:02', type: 'warning', title: 'Movement toward track boundary', location: 'Platform 3 North End', severity: 'HIGH' },
      { id: 'evt-ti3', time: '13:42:17', type: 'info', title: 'Person approaching platform edge', location: 'Platform 3', severity: 'MEDIUM' },
    ],
    aiExplanation: {
      title: 'Potential restricted-zone entry detected',
      confidence: 94,
      observed: [
        'Person entered marked restricted region adjacent to active track',
        'Movement continued for 4.2 seconds within restricted boundary',
        'No authorized worker identifier detected',
        'No active work order registered for this track section',
      ],
      recommended: 'Verify camera feed and review with station security personnel. Alert Station Master and Platform 3 duty officer immediately. Issue emergency track-clear signal if train approaching within next 5 minutes.',
    },
  },
  workerSafety: {
    label: 'Worker Safety',
    description: 'PPE compliance issue in maintenance yard.',
    defaultCamera: 'CAM-04',
    detections: {
      people: 5,
      crowdDensity: 'LOW',
      ppeViolations: 2,
      restrictedZone: 0,
    },
    modelStatus: { status: 'online', inference: 30, threshold: 0.65 },
    boundingBoxes: [
      { id: 'bb-w1', x: 25, y: 30, w: 10, h: 28, label: 'Worker', confidence: 92, color: '#3B82F6' },
      { id: 'bb-w2', x: 45, y: 35, w: 10, h: 26, label: 'PPE Violation', confidence: 88, color: '#F59E0B' },
      { id: 'bb-w3', x: 65, y: 32, w: 10, h: 27, label: 'Worker', confidence: 90, color: '#3B82F6' },
    ],
    events: [
      { id: 'evt-ws1', time: '13:43:02', type: 'warning', title: 'PPE violation detected', location: 'Maintenance Yard', severity: 'MEDIUM' },
      { id: 'evt-ws2', time: '13:41:15', type: 'warning', title: 'Second worker missing safety vest', location: 'Yard Track 2', severity: 'MEDIUM' },
      { id: 'evt-ws3', time: '13:39:40', type: 'info', title: 'Track maintenance crew detected', location: 'Yard Track 2', severity: 'LOW' },
    ],
    aiExplanation: {
      title: 'PPE safety compliance violation detected',
      confidence: 88,
      observed: [
        'Worker detected in active track maintenance zone without mandatory high-visibility safety vest',
        'Helmet and safety boots appear to be worn',
        'Worker is part of a 3-person crew conducting rail inspection',
        'Duration of non-compliance: 3 minutes 12 seconds',
      ],
      recommended: 'Notify Yard Supervisor and Safety Marshal. Issue PPE compliance alert to crew leader. Worker must not continue track-side activity without complete PPE.',
    },
  },
  emergency: {
    label: 'Emergency',
    description: 'Platform fall hazard and emergency escalation.',
    defaultCamera: 'CAM-02',
    detections: {
      people: 22,
      crowdDensity: 'MODERATE',
      ppeViolations: 0,
      restrictedZone: 1,
    },
    modelStatus: { status: 'online', inference: 38, threshold: 0.55 },
    boundingBoxes: [
      { id: 'bb-e1', x: 40, y: 60, w: 14, h: 25, label: 'Fall Hazard', confidence: 91, color: '#EF4444' },
      { id: 'bb-e2', x: 30, y: 55, w: 40, h: 35, label: 'Restricted Zone', confidence: 95, color: '#EF4444' },
      { id: 'bb-e3', x: 15, y: 25, w: 7, h: 18, label: 'Person', confidence: 89, color: '#3B82F6' },
      { id: 'bb-e4', x: 70, y: 22, w: 6, h: 16, label: 'Person', confidence: 86, color: '#3B82F6' },
    ],
    events: [
      { id: 'evt-em1', time: '13:45:02', type: 'critical', title: 'EMERGENCY — Potential fall detected', location: 'Platform 1 Edge', severity: 'CRITICAL' },
      { id: 'evt-em2', time: '13:44:48', type: 'critical', title: 'Person near platform edge — fall risk', location: 'Platform 1 North', severity: 'CRITICAL' },
      { id: 'evt-em3', time: '13:44:31', type: 'warning', title: 'Unusual movement pattern detected', location: 'Platform 1', severity: 'HIGH' },
      { id: 'evt-em4', time: '13:44:10', type: 'info', title: 'Person approaching platform boundary', location: 'Platform 1', severity: 'MEDIUM' },
    ],
    aiExplanation: {
      title: 'EMERGENCY — Potential fall hazard detected',
      confidence: 91,
      observed: [
        'Person detected in fall-risk position near platform edge',
        'Rapid downward movement trajectory identified',
        'Proximity to active track bed: less than 0.5 meters',
        'No train currently at Platform 1 — but next arrival in 3 minutes',
      ],
      recommended: 'IMMEDIATE ACTION REQUIRED: Alert Platform 1 duty officer and Station Master. Trigger emergency track-clear signal. Dispatch medical and RPF response team to Platform 1 north end. Halt approaching train movements.',
    },
  },
};

export const CAMERA_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'platform', label: 'Platform' },
  { key: 'concourse', label: 'Concourse' },
  { key: 'entrance', label: 'Entrance' },
  { key: 'track', label: 'Track' },
  { key: 'maintenance', label: 'Maintenance' },
];

export const CAMERA_STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'online', label: 'Online' },
  { key: 'offline', label: 'Offline' },
  { key: 'alerts', label: 'Alerts' },
  { key: 'aiActive', label: 'AI Active' },
];
