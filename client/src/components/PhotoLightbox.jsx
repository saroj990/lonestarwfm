import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDateTimeAmPm } from '../formatDateTime';

/** size: default | compact (admin dashboard) | square (worker check-in viewer). */
export default function PhotoLightbox({
  open,
  photo,
  worker,
  onClose,
  kicker = 'Check-in photo',
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
  const panelClass = [
    'photo-lightbox-panel',
    size === 'compact' && 'photo-lightbox-panel-compact',
    size === 'square' && 'photo-lightbox-panel-square',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="photo-lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={onClose}>
      <div className={panelClass} onClick={(e) => e.stopPropagation()}>
        <div className="photo-lightbox-head">
          <div className="photo-lightbox-head-text">
            {worker?.username && <div className="photo-lightbox-title">{worker.username}</div>}
            {worker?.employee_id && <div className="photo-lightbox-id muted small">{worker.employee_id}</div>}
          </div>
          <button type="button" className="photo-lightbox-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {src ? (
          <div className="photo-lightbox-media">
            <img src={src} alt="" className="photo-lightbox-img" />
            {!uploadSrc && fallbackSrc && (
              <p className="photo-lightbox-fallback-note muted small">Placeholder — original upload unavailable</p>
            )}
          </div>
        ) : (
          <p className="photo-lightbox-empty muted">No photo uploaded yet for this worker.</p>
        )}

        <div className="photo-lightbox-meta">
          {photo?.created_at && (
            <>
              {kicker && <div className="photo-lightbox-kicker">{kicker}</div>}
              <div className="photo-lightbox-line">{formatDateTimeAmPm(photo.created_at)}</div>
            </>
          )}
          {photo?.latitude != null && (
            <div className="photo-lightbox-line mono small muted">
              {photo.latitude.toFixed(5)}, {photo.longitude.toFixed(5)}
            </div>
          )}
          {photo?.comment && <div className="photo-lightbox-comment">{photo.comment}</div>}
          {worker?.location_at && !photo?.created_at && (
            <div className="photo-lightbox-line muted small">
              Live GPS · {formatDateTimeAmPm(worker.location_at)}
            </div>
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
