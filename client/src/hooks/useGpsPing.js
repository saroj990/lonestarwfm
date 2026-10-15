import { useEffect, useRef } from 'react';
import { api } from '../api';

export function useGpsPing(enabled) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function start() {
      let minutes = 10;
      try {
        const settings = await api('/api/locations/settings');
        minutes = settings.gps_interval_minutes || 10;
      } catch {
        // keep default
      }
      if (cancelled) return;

      const send = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
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
      };

      send();
      intervalRef.current = setInterval(send, minutes * 60 * 1000);
    }

    start();
    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled]);
}
