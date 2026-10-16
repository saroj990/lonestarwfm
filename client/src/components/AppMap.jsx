import { useEffect, useRef, useState } from 'react';
import Map, { Layer, Marker, NavigationControl, Source, useMap } from 'react-map-gl/maplibre';
import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTheme } from '../theme';

// MapLibre resolves its worker relative to its own module URL, which Vite's bundling breaks.
setWorkerUrl(workerUrl);

const STYLES = {
  dark: 'https://tiles.openfreemap.org/styles/dark',
  light: 'https://tiles.openfreemap.org/styles/positron',
};

/** Keyless OpenFreeMap vector basemap that follows the app theme. */
export default function AppMap({ center, zoom = 12, children }) {
  const { theme } = useTheme();
  return (
    <Map
      initialViewState={{ latitude: center[0], longitude: center[1], zoom }}
      mapStyle={STYLES[theme] || STYLES.dark}
      style={{ width: '100%', height: '100%' }}
      maxZoom={18}
    >
      <NavigationControl position="top-left" showCompass={false} />
      {children}
    </Map>
  );
}

/** Centers the map on a single point (e.g. logged-in worker). */
export function FocusOnLocation({ latitude, longitude, zoom = 16 }) {
  const { current: map } = useMap();
  useEffect(() => {
    if (!map || latitude == null || longitude == null) return;
    map.flyTo({ center: [longitude, latitude], zoom, duration: 800 });
  }, [map, latitude, longitude, zoom]);
  return null;
}

/** Fits the viewport to {latitude, longitude} points only when fitKey changes. */
export function FitToPoints({ points, fitKey, maxZoom = 16 }) {
  const { current: map } = useMap();
  const pointsRef = useRef(points);
  pointsRef.current = points;

  useEffect(() => {
    const list = pointsRef.current;
    if (!map || !list.length) return;

    if (list.length === 1) {
      map.jumpTo({ center: [list[0].longitude, list[0].latitude], zoom: Math.min(15, maxZoom) });
      return;
    }

    const lons = list.map((p) => p.longitude);
    const lats = list.map((p) => p.latitude);
    map.fitBounds(
      [
        [Math.min(...lons), Math.min(...lats)],
        [Math.max(...lons), Math.max(...lats)],
      ],
      { padding: 48, maxZoom, duration: 600 }
    );
  }, [map, fitKey, maxZoom]);

  return null;
}

/** Teardrop pin; variant: 'worker' | 'photo' | 'ping'. Optional previewSrc shows image on hover. */
export function Pin({
  latitude,
  longitude,
  variant = 'worker',
  onClick,
  label,
  caption,
  previewSrc,
  previewCaption,
}) {
  const [hover, setHover] = useState(false);

  return (
    <Marker
      latitude={latitude}
      longitude={longitude}
      anchor={variant === 'ping' ? 'center' : 'bottom'}
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onClick?.();
      }}
    >
      <div
        className="map-pin-wrap"
        onMouseEnter={() => previewSrc && setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <button type="button" className={`map-pin map-pin-${variant}`} aria-label={label || caption} />
        {caption && <span className="map-pin-caption">{caption}</span>}
        {previewSrc && hover && (
          <div className="map-pin-preview" role="tooltip">
            <img src={previewSrc} alt="" />
            {previewCaption && <span className="map-pin-preview-caption">{previewCaption}</span>}
          </div>
        )}
      </div>
    </Marker>
  );
}

/** Dashed line through {latitude, longitude} points. */
export function TrailLine({ id, points, color, dash = [2, 2] }) {
  if (points.length < 2) return null;
  const data = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: points.map((p) => [p.longitude, p.latitude]),
    },
  };
  return (
    <Source id={id} type="geojson" data={data}>
      <Layer
        id={`${id}-line`}
        type="line"
        layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        paint={{ 'line-color': color, 'line-width': 2.5, 'line-opacity': 0.9, 'line-dasharray': dash }}
      />
    </Source>
  );
}
