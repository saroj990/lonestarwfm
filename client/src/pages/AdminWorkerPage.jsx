import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppMap, { FitToPoints, Pin, TrailLine } from '../components/AppMap';
import { useTheme } from '../theme';
import { useAuth } from '../auth';
import { api } from '../api';
import AdminHeader from '../components/AdminHeader';
import FeedActivityRow from '../components/FeedActivityRow';
import PhotoLightbox from '../components/PhotoLightbox';
import { CHECKIN_PHOTO_FALLBACK } from '../photoFallback';
import { formatClock, formatDateShort, formatDateTimeAmPm, formatTimeAmPm } from '../formatDateTime';

const DEFAULT_CENTER = [24.4672, 39.6112];

export default function AdminWorkerPage() {
  const { userId } = useParams();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const trailColor = theme === 'dark' ? '#60a5fa' : '#2563eb';
  const historyColor = theme === 'dark' ? '#a3a3a3' : '#6b7280';
  const [worker, setWorker] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [history, setHistory] = useState([]);
  const [showMovementHistory, setShowMovementHistory] = useState(false);
  const [error, setError] = useState('');
  const [fitKey, setFitKey] = useState(0);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const [lastLoaded, setLastLoaded] = useState(null);

  const loadWorker = useCallback(
    async ({ fit = false } = {}) => {
      try {
        const [markersRes, photosRes, historyRes] = await Promise.all([
          api('/api/locations/latest'),
          api(`/api/photos/user/${userId}?limit=100`),
          api(`/api/locations/user/${userId}/history?days=1`),
        ]);

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
        setLastLoaded(new Date());
        setError('');
        if (fit) setFitKey((k) => k + 1);
      } catch (err) {
        setError(err.message);
      }
    },
    [userId]
  );

  useEffect(() => {
    loadWorker({ fit: true });
  }, [loadWorker]);

  const photosAsc = useMemo(
    () => [...photos].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    [photos]
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

  const subtitle = `${employeeId}${
    worker?.location_at ? ` · GPS ${formatTimeAmPm(worker.location_at)}` : ''
  } · ${photos.length} check-in(s)${
    lastLoaded ? ` · Updated ${formatClock(lastLoaded)}` : ''
  }`;

  return (
    <div className="page admin-page admin-page-full">
      <AdminHeader
        user={user}
        title={displayName}
        subtitle={subtitle}
        onRefresh={() => loadWorker({ fit: true })}
        onLogout={logout}
        backLink={
          <Link to="/admin" className="back-link">
            ← Dashboard
          </Link>
        }
      />

      {error && <div className="error admin-error">{error}</div>}

      <div className="admin-split">
        <section className="admin-split-map">
          <div className="map-wrap map-wrap-fill map-wrap-admin">
            <AppMap center={center} zoom={13}>
              <FitToPoints points={mapPoints} fitKey={fitKey} />

              {showMovementHistory ? (
                <TrailLine key="history-trail" id="history-trail" points={history} color={historyColor} dash={[2, 2]} />
              ) : (
                <TrailLine key="photo-trail" id="photo-trail" points={photosAsc} color={trailColor} dash={[3, 2.5]} />
              )}

              {!showMovementHistory &&
                photosAsc.map((p) => (
                  <Pin
                    key={p.id}
                    latitude={p.latitude}
                    longitude={p.longitude}
                    label={`Photo upload · ${formatDateTimeAmPm(p.created_at)}`}
                    caption={formatTimeAmPm(p.created_at)}
                    thumbSrc={p.filename ? `/uploads/${p.filename}` : CHECKIN_PHOTO_FALLBACK}
                    onClick={() => setLightboxPhoto(p)}
                  />
                ))}

              {showMovementHistory &&
                history.map((p, i) => (
                  <Pin
                    key={`${p.created_at}-${i}`}
                    latitude={p.latitude}
                    longitude={p.longitude}
                    variant="ping"
                    label={`GPS ping · ${formatDateTimeAmPm(p.created_at)}`}
                  />
                ))}

              {!showMovementHistory && worker?.latitude != null && photosAsc.length === 0 && (
                <Pin
                  latitude={worker.latitude}
                  longitude={worker.longitude}
                  caption={worker.username}
                  label={`Last live GPS · ${formatDateTimeAmPm(worker.location_at)}`}
                />
              )}
            </AppMap>
          </div>
        </section>

        <aside className="admin-split-panel">
          <div className="panel-block">
            <h3 className="panel-title">Check-ins</h3>

            <div className="worker-panel-meta">
              <div className="worker-map-control">
                <span className="setting-label">Map view</span>
                <label className="worker-map-toggle">
                  <input
                    type="checkbox"
                    checked={showMovementHistory}
                    onChange={(e) => {
                      setShowMovementHistory(e.target.checked);
                      setFitKey((k) => k + 1);
                    }}
                  />
                  <span>Show movement history (GPS pings)</span>
                </label>
                <p className="panel-caption worker-map-hint">
                  {showMovementHistory
                    ? `${history.length} ping(s) today · map shows GPS trail`
                    : `${photosAsc.length} upload(s) on map · blue line = check-in trail`}
                </p>
              </div>

              {(worker?.location_at || worker?.last_photo_at) && (
                <div className="worker-status-grid" aria-label="Latest worker signals">
                  {worker?.location_at && (
                    <div className="worker-status-item">
                      <span className="status-label">Last live GPS</span>
                      <div className="feed-datetime">
                        <time className="feed-time">{formatTimeAmPm(worker.location_at)}</time>
                        <span className="feed-date-sep">·</span>
                        <span className="feed-date">{formatDateShort(worker.location_at)}</span>
                      </div>
                    </div>
                  )}
                  {worker?.last_photo_at && (
                    <div className="worker-status-item">
                      <span className="status-label">Last photo</span>
                      <div className="feed-datetime">
                        <time className="feed-time">{formatTimeAmPm(worker.last_photo_at)}</time>
                        <span className="feed-date-sep">·</span>
                        <span className="feed-date">{formatDateShort(worker.last_photo_at)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {photos.length === 0 ? (
              <p className="muted">No photos for this worker.</p>
            ) : (
              <ul className="feed-list">
                {photos.map((p) => (
                  <FeedActivityRow
                    key={p.id}
                    upload={p}
                    workerName={displayName}
                    employeeId={employeeId}
                    onSelect={setLightboxPhoto}
                  />
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <PhotoLightbox
        open={lightboxPhoto != null}
        photo={lightboxPhoto}
        worker={
          worker
            ? { user_id: worker.user_id, username: worker.username, employee_id: worker.employee_id }
            : null
        }
        kicker="Latest check-in photo"
        size="compact"
        fallbackSrc={CHECKIN_PHOTO_FALLBACK}
        onClose={() => setLightboxPhoto(null)}
      />
    </div>
  );
}
