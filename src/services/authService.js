import apiClient from './apiClient';

const AUTH_STORAGE_KEY = 'railguard_auth_user';
const TOKEN_STORAGE_KEY = 'railguard_auth_token';

export const authService = {
  /**
   * Check if user is currently authenticated
   */
  isAuthenticated() {
    return Boolean(localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY));
  },

  /**
   * Get current authenticated employee context
   */
  getCurrentUser() {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    // Default seeded employee: Rahul Sharma (Officer)
    return {
      id: 'USR-002',
      employee_id: 'RLY-10042',
      name: 'Rahul Sharma',
      email: 'r.sharma@railguard.gov.in',
      role: 'OFFICER',
      department: 'Platform Operations',
      station: 'Vadodara Junction (BRC)',
      status: 'ACTIVE',
    };
  },

  /**
   * Store active user and session token
   */
  setSession(user, token, rememberMe = true) {
    const storage = rememberMe ? localStorage : sessionStorage;
    try {
      storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      storage.setItem(TOKEN_STORAGE_KEY, token);
      if (!rememberMe) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Session store error:', e);
    }
  },

  /**
   * Clear session on logout
   */
  clearSession() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  },

  /**
   * Switch between Admin and Officer roles for interactive demonstration
   */
  switchRole(role) {
    const targetRole = role.toUpperCase();
    const newUser = targetRole === 'ADMIN'
      ? {
          id: 'USR-001',
          employee_id: 'RLY-10001',
          name: 'Arun Patel',
          email: 'a.patel@railguard.gov.in',
          role: 'ADMIN',
          department: 'Station Administration',
          station: 'Vadodara Junction (BRC)',
          status: 'ACTIVE',
        }
      : {
          id: 'USR-002',
          employee_id: 'RLY-10042',
          name: 'Rahul Sharma',
          email: 'r.sharma@railguard.gov.in',
          role: 'OFFICER',
          department: 'Platform Operations',
          station: 'Vadodara Junction (BRC)',
          status: 'ACTIVE',
        };

    const token = `railguard-session-${newUser.role.toLowerCase()}-${newUser.employee_id}`;
    this.setSession(newUser, token, true);
    return newUser;
  },

  /**
   * Authenticate employee via backend API
   */
  async login(employee_id, password, rememberMe = true) {
    try {
      const res = await apiClient.post('/auth/login', {
        employee_id: employee_id.trim().toUpperCase(),
        password,
        remember_me: rememberMe,
      });

      if (res.data && res.data.user && res.data.access_token) {
        this.setSession(res.data.user, res.data.access_token, rememberMe);
        return { success: true, user: res.data.user, token: res.data.access_token };
      }
      throw new Error('Invalid authentication response format');
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;

      if (status === 403) {
        throw new Error(detail || 'This account is currently disabled. Please contact your administrator.');
      } else if (status === 401) {
        throw new Error(detail || 'Employee ID or password is incorrect.');
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        // Fallback for offline prototype demo
        const cleanId = employee_id.trim().toUpperCase();
        if (cleanId === 'RLY-10099') {
          throw new Error('This account is currently disabled. Please contact your administrator.');
        }
        if (
          (cleanId === 'RLY-10042' || cleanId === 'OFFICER') &&
          (password === 'officer123' || password === 'officer')
        ) {
          const user = this.switchRole('OFFICER');
          return { success: true, user };
        }
        if (
          (cleanId === 'RLY-10001' || cleanId === 'ADMIN') &&
          (password === 'admin123' || password === 'admin')
        ) {
          const user = this.switchRole('ADMIN');
          return { success: true, user };
        }
        throw new Error('Employee ID or password is incorrect.');
      }
      throw new Error(detail || 'Unable to connect to the service. Please try again.');
    }
  },

  /**
   * Terminate employee session
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.warn('[authService] logout warning:', err);
    } finally {
      this.clearSession();
    }
  },
};

export default authService;
