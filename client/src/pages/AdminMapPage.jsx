import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../auth';
import { api } from '../api';
import { FitAllMarkers } from '../components/MapHelpers';
import { markerIcon } from '../mapIcons';

const DEFAULT_CENTER = [25.2048, 55.2708];

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso + 'Z').toLocaleString();
}

export default function AdminMapPage() {
  const { user, logout } = useAuth();
  const [markers, setMarkers] = useState([]);
  const [recentUploads, setRecentUploads] = useState([]);
  const [error, setError] = useState('');
  const [gpsIntervalMins, setGpsIntervalMins] = useState(10);
  const [refreshMins, setRefreshMins] = useState(5);
  const [fitKey, setFitKey] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const loadDashboard = useCallback(async ({ fit = false } = {}) => {
    try {
      const [markersRes, recentRes] = await Promise.all([
        api('/api/locations/latest'),
        api('/api/photos/recent?limit=50'),
      ]);
      setMarkers(markersRes.markers);
      setRecentUploads(recentRes.uploads);
      setLastRefreshed(new Date());
      if (fit) setFitKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadDashboard({ fit: true });
    api('/api/locations/settings')
      .then((s) => {
        setGpsIntervalMins(s.gps_interval_minutes);
        setRefreshMins(s.dashboard_refresh_minutes ?? 5);
      })
      .catch(() => {});
  }, [loadDashboard]);

  useEffect(() => {
    const ms = Math.max(refreshMins, 1) * 60 * 1000;
    const t = setInterval(() => loadDashboard(), ms);
    return () => clearInterval(t);
  }, [refreshMins, loadDashboard]);

  async function saveSettings() {
    try {
      const data = await api('/api/locations/settings', {
        method: 'PUT',
        body: JSON.stringify({
          gps_interval_minutes: Number(gpsIntervalMins),
          dashboard_refresh_minutes: Number(refreshMins),
        }),
      });
      setGpsIntervalMins(data.gps_interval_minutes);
      setRefreshMins(data.dashboard_refresh_minutes);
    } catch (err) {
      setError(err.message);
    }
  }

  const center =
    markers.length > 0
      ? [markers[0].latitude, markers[0].longitude]
      : DEFAULT_CENTER;

  return (
    <div className="page admin-page admin-page-full">
      <header className="topbar">
        <div>
          <strong>GPS Dashboard</strong>
          <div className="muted small">
            {user.username} · {user.employee_type} · {markers.length} worker(s) on map
            {lastRefreshed && (
              <>
                {' '}
                · updated {lastRefreshed.toLocaleTimeString()}
              </>
            )}
          </div>
        </div>
        <div className="row">
          <button className="ghost" onClick={() => loadDashboard({ fit: true })}>
            Refresh now
          </button>
          <button className="ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      {user.employee_type === 'admin' && (
        <section className="card compact admin-settings">
          <label className="inline">
            Worker GPS interval (min)
            <input
              type="number"
              min="1"
              value={gpsIntervalMins}
              onChange={(e) => setGpsIntervalMins(e.target.value)}
            />
          </label>
          <label className="inline">
            Dashboard refresh (min)
            <input
              type="number"
              min="1"
              value={refreshMins}
              onChange={(e) => setRefreshMins(e.target.value)}
            />
          </label>
          <button type="button" className="ghost" onClick={saveSettings}>
            Save
          </button>
        </section>
      )}

      <div className="admin-split">
        <section className="admin-split-map">
          <div className="map-wrap map-wrap-fill">
            {markers.length === 0 ? (
              <p className="muted map-empty-msg">
                No worker locations yet. Workers need to open the app or upload a photo.
              </p>
            ) : (
              <MapContainer center={center} zoom={11} className="map" scrollWheelZoom>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitAllMarkers markers={markers} fitKey={fitKey} />
                {markers.map((m) => (
                  <Marker
                    key={m.user_id}
                    position={[m.latitude, m.longitude]}
                    icon={markerIcon}
                  >
                    <Popup>
                      <strong>{m.username}</strong>
                      <br />
                      {m.employee_id}
                      <br />
                      Live GPS: {formatTime(m.location_at)}
                      <br />
                      Last photo: {formatTime(m.last_photo_at)}
                      <br />
                      <Link to={`/admin/worker/${m.user_id}`}>View worker dashboard →</Link>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>
        </section>

        <aside className="admin-split-panel">
          <div className="panel-block">
            <h3>Recent uploads</h3>
            <p className="muted small">Newest first · auto-refresh every {refreshMins} min</p>
            {recentUploads.length === 0 && (
              <p className="muted">No uploads yet.</p>
            )}
            <ul className="feed-list">
              {recentUploads.map((u) => (
                <li key={u.id} className="feed-item">
                  <img src={`/uploads/${u.filename}`} alt="" />
                  <div>
                    <div className="feed-title">
                      <Link to={`/admin/worker/${u.user_id}`}>{u.username}</Link>
                      <span className="muted small"> · {u.employee_id}</span>
                    </div>
                    <div className="small">{formatTime(u.created_at)}</div>
                    {u.comment ? (
                      <div className="small">{u.comment}</div>
                    ) : (
                      <div className="muted small">No comment</div>
                    )}
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
