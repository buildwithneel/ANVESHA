import incidentService from './incidentService';

export const liveMonitoringService = {
  async getCameras() {
    return [];
  },

  async createIncident(incidentData) {
    return await incidentService.createIncident(incidentData);
  },
};

export default liveMonitoringService;
