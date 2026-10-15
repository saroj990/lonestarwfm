import bcrypt from 'bcryptjs';
import { db } from './db.js';

const password_hash = bcrypt.hashSync('admin123', 10);

const existing = db.prepare(`SELECT id FROM users WHERE employee_id = ?`).get('ADMIN001');
if (!existing) {
  db.prepare(
    `INSERT INTO users (username, email, password_hash, gender, mobile_number, employee_id, employee_type)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run('Admin', 'admin@lonestar.local', password_hash, 'other', '0000000000', 'ADMIN001', 'admin');
  console.log('Seeded admin: employee_id=ADMIN001 password=admin123');
} else {
  console.log('Admin already exists');
}

const workerHash = bcrypt.hashSync('worker123', 10);
const worker = db.prepare(`SELECT id FROM users WHERE employee_id = ?`).get('WRK001');
if (!worker) {
  db.prepare(
    `INSERT INTO users (username, email, password_hash, gender, mobile_number, employee_id, employee_type)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run('Demo Worker', 'worker@lonestar.local', workerHash, 'male', '1111111111', 'WRK001', 'worker');
  console.log('Seeded worker: employee_id=WRK001 password=worker123');
} else {
  console.log('Worker already exists');
}
