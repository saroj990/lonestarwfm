import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../auth';
import { api } from '../api';
import { FitToPoints } from '../components/MapHelpers';
import { markerIcon, photoMarkerIcon } from '../mapIcons';

const DEFAULT_CENTER = [25.2048, 55.2708];

function formatTime(iso) {
  return new Date(iso + 'Z').toLocaleString();
}

export default function AdminWorkerPage() {
  const { userId } = useParams();
  const { user, logout } = useAuth();
  const [worker, setWorker] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [history, setHistory] = useState([]);
  const [showMovementHistory, setShowMovementHistory] = useState(false);
  const [error, setError] = useState('');
  const [fitKey, setFitKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [markersRes, photosRes, historyRes] = await Promise.all([
          api('/api/locations/latest'),
          api(`/api/photos/user/${userId}?limit=100`),
          api(`/api/locations/user/${userId}/history?days=1`),
        ]);
        if (cancelled) return;

        const found = markersRes.markers.find((m) => String(m.user_id) === String(userId));
        const base = {
          user_id: photosRes.worker.id,
          username: photosRes.worker.username,
          employee_id: photosRes.worker.employee_id,
          ...(found || {}),
        };
        setWorker(base);
        setPhotos(photosRes.photos);
        setHistory(historyRes.points);
        setFitKey((k) => k + 1);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const photosAsc = useMemo(
    () => [...photos].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    [photos]
  );

  const photoLine = useMemo(
    () => photosAsc.map((p) => [p.latitude, p.longitude]),
    [photosAsc]
  );

  const historyLine = useMemo(
    () => history.map((p) => [p.latitude, p.longitude]),
    [history]
  );

  const mapPoints = useMemo(() => {
    if (showMovementHistory && history.length) return history;
    if (photosAsc.length) return photosAsc;
    if (worker?.latitude != null) return [worker];
    return [];
  }, [showMovementHistory, history, photosAsc, worker]);

  const center =
    mapPoints.length > 0
      ? [mapPoints[0].latitude, mapPoints[0].longitude]
      : worker?.latitude != null
        ? [worker.latitude, worker.longitude]
        : DEFAULT_CENTER;

  const displayName = worker?.username || 'Worker';
  const employeeId = worker?.employee_id || userId;

  return (
    <div className="page admin-page admin-page-full">
      <header className="topbar">
        <div>
          <Link to="/admin" className="back-link">
            ← Dashboard
          </Link>
          <strong>
            {displayName} · {employeeId}
          </strong>
          <div className="muted small">Work status · photo trail & movement</div>
        </div>
        <div className="row">
          <button className="ghost" onClick={() => setFitKey((k) => k + 1)}>
            Fit map
          </button>
          <button className="ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="admin-split">
        <section className="admin-split-map">
          <div className="map-toolbar">
            <label className="toggle-inline">
              <input
                type="checkbox"
                checked={showMovementHistory}
                onChange={(e) => {
                  setShowMovementHistory(e.target.checked);
                  setFitKey((k) => k + 1);
                }}
              />
              Show movement history (GPS pings)
            </label>
            <span className="muted small">
              {showMovementHistory
                ? `${history.length} ping(s) today`
                : `${photosAsc.length} upload marker(s) · dotted = check-in trail`}
            </span>
          </div>
          <div className="map-wrap map-wrap-fill">
            <MapContainer center={center} zoom={13} className="map" scrollWheelZoom>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitToPoints points={mapPoints} fitKey={fitKey} />

              {!showMovementHistory && photoLine.length > 1 && (
                <Polyline
                  positions={photoLine}
                  pathOptions={{ color: '#1f6b4f', weight: 3, dashArray: '10 8' }}
                />
              )}

              {showMovementHistory && historyLine.length > 1 && (
                <Polyline
                  positions={historyLine}
                  pathOptions={{ color: '#2563eb', weight: 3, dashArray: '6 6' }}
                />
              )}

              {!showMovementHistory &&
                photosAsc.map((p) => (
                  <Marker
                    key={p.id}
                    position={[p.latitude, p.longitude]}
                    icon={photoMarkerIcon}
                  >
                    <Popup>
                      Upload · {formatTime(p.created_at)}
                      {p.comment && (
                        <>
                          <br />
                          {p.comment}
                        </>
                      )}
                    </Popup>
                  </Marker>
                ))}

              {showMovementHistory &&
                history.map((p, i) => (
                  <Marker
                    key={`${p.created_at}-${i}`}
                    position={[p.latitude, p.longitude]}
                    icon={markerIcon}
                  >
                    <Popup>GPS · {formatTime(p.created_at)}</Popup>
                  </Marker>
                ))}

              {!showMovementHistory && worker?.latitude != null && photosAsc.length === 0 && (
                <Marker
                  position={[worker.latitude, worker.longitude]}
                  icon={markerIcon}
                >
                  <Popup>Last live GPS · {formatTime(worker.location_at)}</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </section>

        <aside className="admin-split-panel">
          <div className="panel-block">
            <h3>Work status</h3>
            {worker?.location_at && (
              <p className="small">
                Last live GPS: <strong>{formatTime(worker.location_at)}</strong>
              </p>
            )}
            {worker?.last_photo_at ? (
              <p className="small">
                Last photo upload: <strong>{formatTime(worker.last_photo_at)}</strong>
              </p>
            ) : (
              <p className="muted small">No photo uploads yet.</p>
            )}
            <p className="muted small">
              Logged in as {user.username} ({user.employee_type})
            </p>
          </div>

          <div className="panel-block">
            <h3>Uploaded photos</h3>
            {photos.length === 0 && <p className="muted">No photos for this worker.</p>}
            <ul className="photo-list photo-list-panel">
              {photos.map((p) => (
                <li key={p.id}>
                  <img src={`/uploads/${p.filename}`} alt="" />
                  <div>
                    <div>{formatTime(p.created_at)}</div>
                    <div className="muted small">
                      {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                    </div>
                    {p.comment && <div className="small">{p.comment}</div>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
