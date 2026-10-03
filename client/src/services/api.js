import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // 60s for intensive benchmark runs
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sync_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to extract performance telemetry
api.interceptors.response.use(
  (response) => {
    const engine = response.headers['x-database-engine'];
    const latency = response.headers['x-response-time-ms'];

    if (engine || latency) {
      window.dispatchEvent(
        new CustomEvent('sync:telemetry-update', {
          detail: {
            engine: engine || 'unknown',
            latencyMs: latency ? parseFloat(latency) : null,
            timestamp: Date.now(),
          },
        })
      );
    }

    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized on a protected call, clear invalid session
      if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/profile')) {
        // Keep user experience smooth, don't force-reload if on public feed
      }
    }
    return Promise.reject(error);
  }
);

export default api;
