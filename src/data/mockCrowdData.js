export const mockCrowdData = {
  currentStationId: 'CSMT',
  overallStationRiskScore: 68, // 0-100 scale
  totalEstimatedFootfall: 14250,
  peakDensityZone: 'Platform 1 & 2 FOB Staircase',
  densityTrend: 'UPWARD', // UPWARD | STABLE | DOWNWARD
  zones: [
    {
      id: 'ZONE-CSMT-PF1',
      name: 'Platform 1 Main Deck',
      capacity: 3500,
      currentOccupancy: 2780,
      densityPersonsPerSqm: 4.8,
      riskLevel: 'HIGH',
      status: 'HEAVY_CONGESTION',
    },
    {
      id: 'ZONE-CSMT-PF2',
      name: 'Platform 2 Deck',
      capacity: 3500,
      currentOccupancy: 1940,
      densityPersonsPerSqm: 3.2,
      riskLevel: 'MEDIUM',
      status: 'MODERATE_FLOW',
    },
    {
      id: 'ZONE-CSMT-FOB1',
      name: 'Main Foot Overbridge 1',
      capacity: 2000,
      currentOccupancy: 1650,
      densityPersonsPerSqm: 4.2,
      riskLevel: 'HIGH',
      status: 'BOTTLE_NECK',
    },
    {
      id: 'ZONE-CSMT-CONCOURSE',
      name: 'Main Ticket Concourse',
      capacity: 5000,
      currentOccupancy: 2100,
      densityPersonsPerSqm: 2.1,
      riskLevel: 'LOW',
      status: 'NORMAL',
    },
  ],
  hourlyTrend: [
    { time: '08:00', occupancy: 8200 },
    { time: '09:00', occupancy: 12400 },
    { time: '10:00', occupancy: 15800 },
    { time: '11:00', occupancy: 13900 },
    { time: '12:00', occupancy: 14250 },
  ],
};
