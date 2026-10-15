import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { db, uploadDir } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images allowed'));
    }
    cb(null, true);
  },
});

router.post('/', requireAuth, upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'photo is required' });

  const latitude = Number(req.body.latitude);
  const longitude = Number(req.body.longitude);
  const comment = req.body.comment || null;

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return res.status(400).json({ error: 'latitude and longitude are required' });
  }

  const result = db
    .prepare(
      `INSERT INTO photos (user_id, filename, latitude, longitude, comment)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(req.user.id, req.file.filename, latitude, longitude, comment);

  // Also record as latest location
  db.prepare(`INSERT INTO locations (user_id, latitude, longitude) VALUES (?, ?, ?)`).run(
    req.user.id,
    latitude,
    longitude
  );

  const photo = db
    .prepare(
      `SELECT p.*, u.username, u.employee_id
       FROM photos p JOIN users u ON u.id = p.user_id
       WHERE p.id = ?`
    )
    .get(result.lastInsertRowid);

  // Bare-minimum "notify admin": log + store is enough for now
  console.log(`[NOTIFY] New photo from ${photo.username} (${photo.employee_id}) at ${latitude},${longitude}`);

  res.status(201).json({ photo });
});

router.get('/mine', requireAuth, (req, res) => {
  const photos = db
    .prepare(
      `SELECT id, filename, latitude, longitude, comment, created_at
       FROM photos WHERE user_id = ? ORDER BY created_at DESC`
    )
    .all(req.user.id);
  res.json({ photos });
});

router.get('/recent', requireAuth, requireRole('admin', 'manager'), (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 40, 1), 100);
  const uploads = db
    .prepare(
      `SELECT p.id, p.filename, p.latitude, p.longitude, p.comment, p.created_at,
              u.id AS user_id, u.username, u.employee_id
       FROM photos p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC
       LIMIT ?`
    )
    .all(limit);
  res.json({ uploads });
});

router.get('/user/:userId', requireAuth, requireRole('admin', 'manager'), (req, res) => {
  const userId = Number(req.params.userId);
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
  const worker = db
    .prepare(`SELECT id, username, employee_id FROM users WHERE id = ?`)
    .get(userId);
  if (!worker) return res.status(404).json({ error: 'User not found' });
  const photos = db
    .prepare(
      `SELECT id, filename, latitude, longitude, comment, created_at
       FROM photos WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`
    )
    .all(userId, limit);
  res.json({ worker, photos });
});

export default router;
