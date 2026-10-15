import { Link } from 'react-router-dom';
import { formatDateShort, formatTimeAmPm } from '../formatDateTime';
import { regionLabelForUsername } from '../adminRegions';

export default function FeedActivityRow({ upload }) {
  return (
    <li className="feed-item">
      <img src={`/uploads/${upload.filename}`} alt="" />
      <div className="feed-body">
        <div className="feed-title-row">
          <Link to={`/admin/worker/${upload.user_id}`} className="feed-worker-link">
            {upload.username}
          </Link>
          <span className="region-badge">{regionLabelForUsername(upload.username)}</span>
        </div>
        <div className="feed-id">{upload.employee_id}</div>
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
