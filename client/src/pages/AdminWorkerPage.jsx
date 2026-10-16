import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppMap, { FitToPoints, Pin, TrailLine } from '../components/AppMap';
import { useTheme } from '../theme';
import { useAuth } from '../auth';
import { api } from '../api';
import AdminHeader from '../components/AdminHeader';
import PhotoLightbox from '../components/PhotoLightbox';
import { CHECKIN_PHOTO_FALLBACK } from '../photoFallback';
import { formatDateShort, formatDateTimeAmPm, formatTimeAmPm } from '../formatDateTime';

const DEFAULT_CENTER = [24.4672, 39.6112];

export default function AdminWorkerPage() {
  const { userId } = useParams();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const trailColor = theme === 'dark' ? '#ffffff' : '#111111';
  const historyColor = theme === 'dark' ? '#a3a3a3' : '#525252';
  const [worker, setWorker] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [history, setHistory] = useState([]);
  const [showMovementHistory, setShowMovementHistory] = useState(false);
  const [error, setError] = useState('');
  const [fitKey, setFitKey] = useState(0);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
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
      <AdminHeader
        user={user}
        title={`${displayName}`}
        subtitle={`${employeeId} · Work status & movement`}
        onLogout={logout}
        backLink={
          <Link to="/admin" className="back-link">
            ← Dashboard
          </Link>
        }
        extraActions={
          <button type="button" className="btn-admin secondary" onClick={() => setFitKey((k) => k + 1)}>
            Fit map
          </button>
        }
      />

      {error && <div className="error admin-error">{error}</div>}

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
                    thumbSrc={p.filename ? `/uploads/${p.filename}` : CHECKIN_PHOTO_FALLBACK}
                    tooltip={formatDateTimeAmPm(p.created_at)}
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
                  label={`Last live GPS · ${formatDateTimeAmPm(worker.location_at)}`}
                />
              )}
            </AppMap>
          </div>
        </section>

        <aside className="admin-split-panel">
          <div className="panel-block">
            <h3 className="panel-title">Work status</h3>
            {worker?.location_at && (
              <p className="status-line">
                <span className="status-label">Last live GPS</span>
                <span className="feed-datetime">
                  <time className="feed-time">{formatTimeAmPm(worker.location_at)}</time>
                  <span className="feed-date-sep">·</span>
                  <span className="feed-date">{formatDateShort(worker.location_at)}</span>
                </span>
              </p>
            )}
            {worker?.last_photo_at ? (
              <p className="status-line">
                <span className="status-label">Last photo</span>
                <span className="feed-datetime">
                  <time className="feed-time">{formatTimeAmPm(worker.last_photo_at)}</time>
                  <span className="feed-date-sep">·</span>
                  <span className="feed-date">{formatDateShort(worker.last_photo_at)}</span>
                </span>
              </p>
            ) : (
              <p className="muted small">No photo uploads yet.</p>
            )}
          </div>

          <div className="panel-block">
            <h3 className="panel-title">Uploaded photos</h3>
            {photos.length === 0 && <p className="muted">No photos for this worker.</p>}
            <ul className="photo-list photo-list-panel photo-list-admin">
              {photos.map((p) => (
                <li key={p.id}>
                  <button type="button" className="photo-list-thumb" onClick={() => setLightboxPhoto(p)}>
                    <img src={`/uploads/${p.filename}`} alt="" />
                  </button>
                  <div>
                    <div className="feed-datetime">
                      <time className="feed-time">{formatTimeAmPm(p.created_at)}</time>
                      <span className="feed-date-sep">·</span>
                      <span className="feed-date">{formatDateShort(p.created_at)}</span>
                    </div>
                    <div className="muted small mono">
                      {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                    </div>
                    {p.comment && <div className="feed-comment">{p.comment}</div>}
                  </div>
                </li>
              ))}
            </ul>
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
        size="square"
        fallbackSrc={CHECKIN_PHOTO_FALLBACK}
        onClose={() => setLightboxPhoto(null)}
      />
    </div>
  );
}
