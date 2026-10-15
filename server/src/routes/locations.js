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
         (SELECT MAX(p.created_at) FROM photos p WHERE p.user_id = u.id) AS last_photo_at
       FROM users u
       JOIN locations l ON l.id = (
         SELECT id FROM locations WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1
       )
       WHERE u.employee_type = 'worker'
       ORDER BY l.created_at DESC`
    )
    .all();
  res.json({ markers });
});

router.get('/settings', requireAuth, (_req, res) => {
  const row = db.prepare(`SELECT value FROM settings WHERE key = 'gps_interval_minutes'`).get();
  res.json({ gps_interval_minutes: Number(row?.value || 10) });
});

router.put('/settings', requireAuth, requireRole('admin'), (req, res) => {
  const minutes = Number(req.body.gps_interval_minutes);
  if (!minutes || minutes < 1) {
    return res.status(400).json({ error: 'gps_interval_minutes must be >= 1' });
  }
  db.prepare(`INSERT INTO settings (key, value) VALUES ('gps_interval_minutes', ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(String(minutes));
  res.json({ gps_interval_minutes: minutes });
});

export default router;
