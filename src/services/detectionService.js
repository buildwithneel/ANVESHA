import apiClient from './apiClient';

export const detectionService = {
  /**
   * Fetch recent AI detections
   */
  async getDetections(filters = {}) {
    try {
      const response = await apiClient.get('/detections', { params: filters });
      return response.data;
    } catch (err) {
      console.warn('[DetectionService] Error fetching detections:', err);
      return [];
    }
  },

  /**
   * Ingest a real-time ML detection event
   */
  async ingestDetection(payload) {
    const response = await apiClient.post('/detections', payload);
    return response.data;
  },
};

export default detectionService;
