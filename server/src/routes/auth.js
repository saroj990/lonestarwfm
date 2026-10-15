import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { signToken, requireAuth } from '../auth.js';

const router = Router();

router.post('/register', (req, res) => {
  const {
    username,
    email,
    password,
    gender,
    passport_number,
    mobile_number,
    employee_id,
    employee_type = 'worker',
  } = req.body || {};

  if (!username || !email || !password || !employee_id) {
    return res.status(400).json({ error: 'username, email, password, employee_id are required' });
  }

  const type = ['worker', 'manager', 'admin'].includes(employee_type) ? employee_type : 'worker';
  const password_hash = bcrypt.hashSync(password, 10);

  try {
    const result = db
      .prepare(
        `INSERT INTO users
          (username, email, password_hash, gender, passport_number, mobile_number, employee_id, employee_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        username,
        email,
        password_hash,
        gender || null,
        passport_number || null,
        mobile_number || null,
        employee_id,
        type
      );

    const user = db.prepare('SELECT id, username, email, employee_id, employee_type FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email or employee ID already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', (req, res) => {
  const { employee_id, password } = req.body || {};
  if (!employee_id || !password) {
    return res.status(400).json({ error: 'employee_id and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE employee_id = ?').get(employee_id);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid employee ID or password' });
  }

  const safe = {
    id: user.id,
    username: user.username,
    email: user.email,
    employee_id: user.employee_id,
    employee_type: user.employee_type,
  };
  res.json({ token: signToken(safe), user: safe });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db
    .prepare(
      `SELECT id, username, email, gender, passport_number, mobile_number, employee_id, employee_type, created_at
       FROM users WHERE id = ?`
    )
    .get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

export default router;
