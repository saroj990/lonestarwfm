import { useCallback, useEffect, useMemo, useState } from 'react';
import { REGION_FILTERS, matchesRegionFilter } from '../adminRegions';
import { Link } from 'react-router-dom';
import { Popup } from 'react-map-gl/maplibre';
import AppMap, { FitToPoints, Pin } from '../components/AppMap';
import { useAuth } from '../auth';
import { api } from '../api';
import AdminHeader from '../components/AdminHeader';
import AdminSettingsPanel from '../components/AdminSettingsPanel';
import FeedActivityRow from '../components/FeedActivityRow';
import { formatClock, formatDateTimeAmPm } from '../formatDateTime';

const DEFAULT_CENTER = [24.4672, 39.6112];

export default function AdminMapPage() {
  const { user, logout } = useAuth();
  const [markers, setMarkers] = useState([]);
  const [recentUploads, setRecentUploads] = useState([]);
  const [error, setError] = useState('');
  const [gpsIntervalMins, setGpsIntervalMins] = useState(10);
  const [refreshMins, setRefreshMins] = useState(5);
  const [fitKey, setFitKey] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [regionFilter, setRegionFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const filteredMarkers = useMemo(
    () => markers.filter((m) => matchesRegionFilter(m.username, regionFilter)),
    [markers, regionFilter]
  );

  const filteredUploads = useMemo(
    () => recentUploads.filter((u) => matchesRegionFilter(u.username, regionFilter)),
    [recentUploads, regionFilter]
  );

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

  useEffect(() => {
    setFitKey((k) => k + 1);
  }, [regionFilter]);

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
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    }
  }

  const selected = filteredMarkers.find((m) => m.user_id === selectedId);

  const center =
    filteredMarkers.length > 0
      ? [filteredMarkers[0].latitude, filteredMarkers[0].longitude]
      : DEFAULT_CENTER;

  const subtitle = `${filteredMarkers.length} worker(s) in view${
    regionFilter !== 'all' ? ` · ${markers.length} total` : ''
  }${lastRefreshed ? ` · Updated ${formatClock(lastRefreshed)}` : ''}`;

  return (
    <div className="page admin-page admin-page-full">
      <AdminHeader
        user={user}
        title="Location intelligence"
        subtitle={subtitle}
        onRefresh={() => loadDashboard({ fit: true })}
        onOpenSettings={() => setSettingsOpen((o) => !o)}
        settingsOpen={settingsOpen}
        onLogout={logout}
      />

      {error && <div className="error admin-error">{error}</div>}

      {settingsOpen && user.employee_type === 'admin' && (
        <AdminSettingsPanel
          gpsIntervalMins={gpsIntervalMins}
          setGpsIntervalMins={setGpsIntervalMins}
          refreshMins={refreshMins}
          setRefreshMins={setRefreshMins}
          onSave={saveSettings}
          saved={settingsSaved}
        />
      )}

      <div className="admin-split">
        <section className="admin-split-map">
          <div className="map-wrap map-wrap-fill map-wrap-admin">
            {filteredMarkers.length === 0 ? (
              <p className="muted map-empty-msg">
                No workers in this region filter. Try another region or refresh.
              </p>
            ) : (
              <AppMap center={center} zoom={11}>
                <FitToPoints points={filteredMarkers} fitKey={fitKey} maxZoom={15} />
                {filteredMarkers.map((m) => (
                  <Pin
                    key={m.user_id}
                    latitude={m.latitude}
                    longitude={m.longitude}
                    label={m.username}
                    onClick={() => setSelectedId(m.user_id)}
                  />
                ))}
                {selected && (
                  <Popup
                    latitude={selected.latitude}
                    longitude={selected.longitude}
                    offset={34}
                    onClose={() => setSelectedId(null)}
                  >
                    <strong>{selected.username}</strong>
                    <br />
                    {selected.employee_id}
                    <br />
                    Live GPS: {formatDateTimeAmPm(selected.location_at)}
                    <br />
                    Last photo: {formatDateTimeAmPm(selected.last_photo_at)}
                    <br />
                    <Link to={`/admin/worker/${selected.user_id}`}>View worker →</Link>
                  </Popup>
                )}
              </AppMap>
            )}
          </div>
        </section>

        <aside className="admin-split-panel">
          <div className="panel-block">
            <h3 className="panel-title">Activity feed</h3>
            <label className="region-filter">
              <span className="setting-label">Region filter</span>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
              >
                {REGION_FILTERS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="panel-caption">
              Synced with map · auto-refresh every {refreshMins} min
            </p>
            {filteredUploads.length === 0 ? (
              <p className="muted">No uploads in this region.</p>
            ) : (
              <ul className="feed-list">
                {filteredUploads.map((u) => (
                  <FeedActivityRow key={u.id} upload={u} />
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
