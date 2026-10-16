import { Link } from 'react-router-dom';
import { formatDateShort, formatTimeAmPm } from '../formatDateTime';
import { regionLabelForUsername } from '../adminRegions';
import { CHECKIN_PHOTO_FALLBACK } from '../photoFallback';

function photoSrc(filename) {
  return filename ? `/uploads/${filename}` : CHECKIN_PHOTO_FALLBACK;
}

export default function FeedActivityRow({ upload, onSelect, workerName, employeeId }) {
  const selectable = Boolean(onSelect);
  const username = workerName ?? upload.username;
  const idLine = employeeId ?? upload.employee_id;

  function handleClick() {
    onSelect?.(upload);
  }

  function handleKeyDown(e) {
    if (!selectable) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }

  return (
    <li
      className={`feed-item${selectable ? ' feed-item-selectable' : ''}`}
      role={selectable ? 'button' : undefined}
      tabIndex={selectable ? 0 : undefined}
      onClick={selectable ? handleClick : undefined}
      onKeyDown={selectable ? handleKeyDown : undefined}
    >
      <img src={photoSrc(upload.filename)} alt="" />
      <div className="feed-body">
        {workerName == null ? (
          <div className="feed-title-row">
            <Link
              to={`/admin/worker/${upload.user_id}`}
              className="feed-worker-link"
              onClick={(e) => e.stopPropagation()}
            >
              {upload.username}
            </Link>
            <span className="region-badge">{regionLabelForUsername(upload.username)}</span>
          </div>
        ) : (
          <div className="feed-title-row">
            <span className="feed-worker-link">{username}</span>
            <span className="region-badge">{regionLabelForUsername(username)}</span>
          </div>
        )}
        {idLine && <div className="feed-id">{idLine}</div>}
        <div className="feed-datetime">
          <time className="feed-time">{formatTimeAmPm(upload.created_at)}</time>
          <span className="feed-date-sep">·</span>
          <span className="feed-date">{formatDateShort(upload.created_at)}</span>
        </div>
        <p className="feed-comment">{upload.comment || 'No comment'}</p>
      </div>
    </li>
  );
}
