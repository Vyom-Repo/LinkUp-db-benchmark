import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const DatabaseContext = createContext();

export const DatabaseProvider = ({ children }) => {
  const [activeEngine, setActiveEngine] = useState('postgres');
  const [lastLatencyMs, setLastLatencyMs] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);
  const [switching, setSwitching] = useState(false);

  // Listen to live telemetry events from axios interceptors
  useEffect(() => {
    const handleTelemetry = (e) => {
      if (e.detail?.engine && e.detail.engine !== 'unknown') {
        setActiveEngine(e.detail.engine);
      }
      if (typeof e.detail?.latencyMs === 'number') {
        setLastLatencyMs(e.detail.latencyMs);
      }
    };

    window.addEventListener('sync:telemetry-update', handleTelemetry);
    return () => window.removeEventListener('sync:telemetry-update', handleTelemetry);
  }, []);

  // Fetch initial database status
  const fetchStatus = async () => {
    try {
      const res = await api.get('/admin/database/status');
      if (res.data.success) {
        setDbStatus(res.data.data);
        setActiveEngine(res.data.data.activeEngine);
      }
    } catch (err) {
      console.warn('Could not fetch database status:', err.message);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Global Engine Switcher
  const switchEngine = async (engine) => {
    setSwitching(true);
    try {
      const res = await api.post('/admin/database/switch', { engine });
      if (res.data.success) {
        setActiveEngine(res.data.data.activeEngine);
        await fetchStatus();
        return res.data.data;
      }
    } finally {
      setSwitching(false);
    }
  };

  return (
    <DatabaseContext.Provider
      value={{
        activeEngine,
        lastLatencyMs,
        dbStatus,
        switching,
        switchEngine,
        refreshStatus: fetchStatus,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => useContext(DatabaseContext);
