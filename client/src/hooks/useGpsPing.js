import { useEffect } from 'react';
import { api } from '../api';

const DEFAULT_INTERVAL_MINUTES = 1;

async function fetchIntervalMinutes() {
  try {
    const settings = await api('/api/locations/settings');
    const minutes = Number(settings.gps_interval_minutes);
    return minutes >= 1 ? minutes : DEFAULT_INTERVAL_MINUTES;
  } catch {
    return DEFAULT_INTERVAL_MINUTES;
  }
}

/**
 * Sends GPS to POST /api/locations on a server-configured interval while the worker
 * page is mounted and the browser tab is visible. Stops when the user leaves the
 * page, logs out, or hides/closes the tab.
 */
export function useGpsPing(enabled) {
  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;
    let timeoutId = null;

    function clearTimer() {
      if (timeoutId != null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }

    function sendLocation() {
      if (cancelled || document.visibilityState !== 'visible') return;
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (cancelled) return;
          try {
            await api('/api/locations', {
              method: 'POST',
              body: JSON.stringify({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              }),
            });
          } catch (err) {
            console.warn('GPS ping failed', err.message);
          }
        },
        (err) => console.warn('Geolocation error', err.message),
        { enableHighAccuracy: true, maximumAge: 60000, timeout: 15000 }
      );
    }

    async function scheduleLoop() {
      if (cancelled || document.visibilityState !== 'visible') return;

      sendLocation();

      const minutes = await fetchIntervalMinutes();
      if (cancelled || document.visibilityState !== 'visible') return;

      clearTimer();
      timeoutId = setTimeout(scheduleLoop, minutes * 60 * 1000);
    }

    function startTracking() {
      clearTimer();
      scheduleLoop();
    }

    function stopTracking() {
      clearTimer();
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        startTracking();
      } else {
        stopTracking();
      }
    }

    if (document.visibilityState === 'visible') {
      startTracking();
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      stopTracking();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [enabled]);
}
