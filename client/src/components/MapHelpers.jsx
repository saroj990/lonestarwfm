import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/** Centers the map on a single point (e.g. logged-in worker). */
export function FocusOnLocation({ latitude, longitude, zoom = 16 }) {
  const map = useMap();
  useEffect(() => {
    if (latitude == null || longitude == null) return;
    map.setView([latitude, longitude], zoom, { animate: true });
  }, [map, latitude, longitude, zoom]);
  return null;
}

/** Fits the viewport to all markers when fitKey changes (login / refresh, not background polls). */
export function FitAllMarkers({ markers, fitKey }) {
  const map = useMap();
  const markersRef = useRef(markers);
  markersRef.current = markers;

  useEffect(() => {
    const list = markersRef.current;
    if (!list.length) return;

    if (list.length === 1) {
      map.setView([list[0].latitude, list[0].longitude], 14);
      return;
    }

    const bounds = L.latLngBounds(list.map((m) => [m.latitude, m.longitude]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
  }, [map, fitKey]);

  return null;
}

/** Fits map to lat/lng points when fitKey changes. */
export function FitToPoints({ points, fitKey }) {
  const map = useMap();
  const pointsRef = useRef(points);
  pointsRef.current = points;

  useEffect(() => {
    const list = pointsRef.current;
    if (!list.length) return;

    if (list.length === 1) {
      map.setView([list[0].latitude, list[0].longitude], 15);
      return;
    }

    const bounds = L.latLngBounds(list.map((p) => [p.latitude, p.longitude]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
  }, [map, fitKey]);

  return null;
}
