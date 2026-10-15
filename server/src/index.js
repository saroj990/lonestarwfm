import express from 'express';
import cors from 'cors';
import path from 'path';
import { uploadDir } from './db.js';
import authRoutes from './routes/auth.js';
import photoRoutes from './routes/photos.js';
import locationRoutes from './routes/locations.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/locations', locationRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(400).json({ error: err.message || 'Request failed' });
});

app.listen(PORT, () => {
  console.log(`LoneStar WFM API on http://localhost:${PORT}`);
});
