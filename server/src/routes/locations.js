import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';

const router = Router();

router.post('/', requireAuth, (req, res) => {
  const latitude = Number(req.body.latitude);
  const longitude = Number(req.body.longitude);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return res.status(400).json({ error: 'latitude and longitude are required' });
  }

  db.prepare(`INSERT INTO locations (user_id, latitude, longitude) VALUES (?, ?, ?)`).run(
    req.user.id,
    latitude,
    longitude
  );

  console.log(
    `[GPS] ${req.user.username} (${req.user.employee_id}) → ${latitude},${longitude}`
  );

  res.status(201).json({ ok: true });
});

router.get('/latest', requireAuth, requireRole('admin', 'manager'), (_req, res) => {
  const markers = db
    .prepare(
      `SELECT
         u.id AS user_id,
         u.username,
         u.employee_id,
         u.employee_type,
         l.latitude,
         l.longitude,
         l.created_at AS location_at,
         (SELECT COUNT(*) FROM photos p WHERE p.user_id = u.id) AS photo_count,
         lp.created_at AS last_photo_at,
         lp.filename AS last_photo_filename,
         lp.latitude AS last_photo_latitude,
         lp.longitude AS last_photo_longitude,
         lp.comment AS last_photo_comment
       FROM users u
       JOIN locations l ON l.id = (
         SELECT id FROM locations WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1
       )
       LEFT JOIN photos lp ON lp.id = (
         SELECT id FROM photos WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1
       )
       WHERE u.employee_type = 'worker'
       ORDER BY l.created_at DESC`
    )
    .all();
  res.json({ markers });
});

function getSetting(key, fallback) {
  const row = db.prepare(`SELECT value FROM settings WHERE key = ?`).get(key);
  return Number(row?.value ?? fallback);
}

router.get('/user/:userId/history', requireAuth, requireRole('admin', 'manager'), (req, res) => {
  const userId = Number(req.params.userId);
  const days = Math.min(Math.max(Number(req.query.days) || 1, 1), 30);
  const points = db
    .prepare(
      `SELECT latitude, longitude, created_at
       FROM locations
       WHERE user_id = ? AND created_at >= datetime('now', ?)
       ORDER BY created_at ASC`
    )
    .all(userId, `-${days} days`);
  res.json({ points });
});

router.get('/settings', requireAuth, (_req, res) => {
  res.json({
    gps_interval_minutes: getSetting('gps_interval_minutes', 10),
    dashboard_refresh_minutes: getSetting('dashboard_refresh_minutes', 5),
  });
});

router.put('/settings', requireAuth, requireRole('admin'), (req, res) => {
  const upsert = db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  );

  if (req.body.gps_interval_minutes != null) {
    const minutes = Number(req.body.gps_interval_minutes);
    if (!minutes || minutes < 1) {
      return res.status(400).json({ error: 'gps_interval_minutes must be >= 1' });
    }
    upsert.run('gps_interval_minutes', String(minutes));
  }

  if (req.body.dashboard_refresh_minutes != null) {
    const refresh = Number(req.body.dashboard_refresh_minutes);
    if (!refresh || refresh < 1) {
      return res.status(400).json({ error: 'dashboard_refresh_minutes must be >= 1' });
    }
    upsert.run('dashboard_refresh_minutes', String(refresh));
  }

  res.json({
    gps_interval_minutes: getSetting('gps_interval_minutes', 10),
    dashboard_refresh_minutes: getSetting('dashboard_refresh_minutes', 5),
  });
});

export default router;
