import { useState, useEffect, useCallback } from 'react';

export const checkServerHealth = async () => {
  if (!navigator.onLine) return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch('/api/health', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return data && data.status === 'ok';
    }
    return false;
  } catch (err) {
    return false;
  }
};

export const useConnectivity = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const performHealthCheck = useCallback(async () => {
    setIsChecking(true);
    const reachable = await checkServerHealth();
    setIsOnline(reachable);
    setIsChecking(false);
    return reachable;
  }, []);

  useEffect(() => {
    // Initial check
    performHealthCheck();

    // Continuous polling every 3.5 seconds
    const interval = setInterval(() => {
      performHealthCheck();
    }, 3500);

    const handleBrowserOnline = () => performHealthCheck();
    const handleBrowserOffline = () => setIsOnline(false);

    window.addEventListener('online', handleBrowserOnline);
    window.addEventListener('offline', handleBrowserOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleBrowserOnline);
      window.removeEventListener('offline', handleBrowserOffline);
    };
  }, [performHealthCheck]);

  return { isOnline, isChecking, checkConnectionNow: performHealthCheck, setIsOnline };
};
