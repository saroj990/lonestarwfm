import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDateTimeAmPm } from '../formatDateTime';
import { parseCheckinComment } from '../parseCheckinComment';
import { regionLabelForUsername } from '../adminRegions';

function IconCalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="11" r="2.2" fill="currentColor" />
    </svg>
  );
}

function IconRoute() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 16c2-4 4-4 6 0s4 4 6 0 4-4 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconList() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconDistance() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m4 20 8-16 8 16M7.5 14h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Check-in card modal (admin dashboard + worker detail). */
export default function PhotoLightbox({
  open,
  photo,
  worker,
  onClose,
  kicker = 'Latest check-in photo',
  size = 'default',
  fallbackSrc,
}) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const uploadSrc = photo?.filename ? `/uploads/${photo.filename}` : null;
  const src = uploadSrc || fallbackSrc || null;
  const parsed = parseCheckinComment(photo?.comment || '');
  const region =
    parsed.region || (worker?.username ? regionLabelForUsername(worker.username) : null);
  const panelClass = [
    'photo-lightbox-panel',
    'photo-lightbox-panel-card',
    size === 'compact' && 'photo-lightbox-panel-card-compact',
    size === 'square' && 'photo-lightbox-panel-card-wide',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="photo-lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={onClose}>
      <div className={panelClass} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="photo-lightbox-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {src ? (
          <div className="photo-lightbox-hero">
            <img src={src} alt="" className="photo-lightbox-hero-img" />
          </div>
        ) : (
          <div className="photo-lightbox-hero photo-lightbox-hero-empty">
            <p className="muted">No photo uploaded yet for this worker.</p>
          </div>
        )}

        <div className="photo-lightbox-card-body">
          <div className="photo-lightbox-kicker">{kicker}</div>

          {worker?.username && (
            <div className="photo-lightbox-worker-line">
              {worker.username}
              {worker.employee_id && <span className="muted"> · {worker.employee_id}</span>}
            </div>
          )}

          {photo?.created_at && (
            <div className="photo-lightbox-datetime-row">
              <span className="photo-lightbox-cal-badge" aria-hidden="true">
                <IconCalendar />
              </span>
              <time className="photo-lightbox-datetime">{formatDateTimeAmPm(photo.created_at)}</time>
            </div>
          )}

          {!photo?.created_at && worker?.location_at && (
            <div className="photo-lightbox-datetime-row">
              <span className="photo-lightbox-cal-badge" aria-hidden="true">
                <IconCalendar />
              </span>
              <span className="photo-lightbox-datetime muted">Live GPS · {formatDateTimeAmPm(worker.location_at)}</span>
            </div>
          )}

          <div className="photo-lightbox-stats">
            {region && (
              <span className="photo-lightbox-region-badge">
                <IconPin />
                {region}
              </span>
            )}
            {parsed.scenario && (
              <span className="photo-lightbox-stat">
                <IconRoute />
                {parsed.scenario}
              </span>
            )}
            {parsed.checkIn && (
              <span className="photo-lightbox-stat">
                <IconList />
                Check-in #{parsed.checkIn}
              </span>
            )}
            {parsed.distanceKm && (
              <span className="photo-lightbox-stat">
                <IconDistance />~{parsed.distanceKm} km
              </span>
            )}
          </div>

          {!uploadSrc && fallbackSrc && src && (
            <p className="photo-lightbox-fallback-note muted small">Showing placeholder — original file unavailable</p>
          )}

          {worker?.user_id && size !== 'square' && (
            <Link to={`/admin/worker/${worker.user_id}`} className="photo-lightbox-link" onClick={onClose}>
              Open worker dashboard →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
