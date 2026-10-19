/**
 * Demo seed: 20 workers across four zones of Medina (Al-Madinah, Saudi Arabia).
 * Scenarios: stationary (no movement), onsite (small steps), away (far from site).
 */
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, uploadDir } from './db.js';
import {
  jitterMeters,
  offsetMeters,
  randomBearing,
  randomSmallStepMeters,
} from './geo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_ASSETS_DIR = path.join(__dirname, '..', 'seed-assets');
const SEED_PHOTO_SOURCES = [
  path.join(SEED_ASSETS_DIR, 'checkin-primary.jpg'),
  path.join(SEED_ASSETS_DIR, 'checkin-worker.jpg'),
  path.join(SEED_ASSETS_DIR, 'checkin-site.jpg'),
];

const DEMO_PASSWORD = 'worker123';
const WORKER_COUNT = 20;
const PHOTOS_PER_USER = 10;
const EXTRA_GPS_PINGS_PER_USER = 15;
const SHARED_FILENAME = 'seed-demo-checkin.jpg';

const DEMO_EMPLOYEE_IDS = Array.from({ length: WORKER_COUNT }, (_, i) =>
  `DEMO${String(i + 1).padStart(3, '0')}`
);

/** slot 0–1 stationary, 2–3 onsite small walks, 4 away from site */
const SCENARIOS = ['stationary', 'stationary', 'onsite', 'onsite', 'away'];

/** Labels must match client/src/adminRegions.js. */
const REGION_PLAN = [
  { label: 'Haram', place: 'Al-Masjid an-Nabawi', center: { latitude: 24.4672, longitude: 39.6112 }, count: 5 },
  { label: 'Quba', place: 'Quba Mosque', center: { latitude: 24.4393, longitude: 39.6173 }, count: 5 },
  { label: 'Uhud', place: 'Mount Uhud', center: { latitude: 24.5013, longitude: 39.6155 }, count: 5 },
  { label: 'Airport', place: 'Prince Mohammad bin Abdulaziz Airport', center: { latitude: 24.5534, longitude: 39.7051 }, count: 5 },
];

const MINIMAL_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAD8AVAv/2Q==',
  'base64'
);

function ensureSharedPhoto() {
  const dest = path.join(uploadDir, SHARED_FILENAME);
  const source = SEED_PHOTO_SOURCES.find((p) => fs.existsSync(p));
  if (source) {
    fs.copyFileSync(source, dest);
  } else {
    fs.writeFileSync(dest, MINIMAL_JPEG);
  }
  console.log(`Shared photo ${dest}${source ? ` (from ${path.basename(source)})` : ' (minimal placeholder)'}`);
  return SHARED_FILENAME;
}

function isoHoursAgo(hours) {
  const d = new Date(Date.now() - hours * 60 * 60 * 1000);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function cleanDemoUsers() {
  const placeholders = DEMO_EMPLOYEE_IDS.map(() => '?').join(',');
  const ids = db
    .prepare(`SELECT id FROM users WHERE employee_id IN (${placeholders})`)
    .all(...DEMO_EMPLOYEE_IDS)
    .map((r) => r.id);
  if (!ids.length) return;
  const idPh = ids.map(() => '?').join(',');
  db.prepare(`DELETE FROM photos WHERE user_id IN (${idPh})`).run(...ids);
  db.prepare(`DELETE FROM locations WHERE user_id IN (${idPh})`).run(...ids);
  db.prepare(`DELETE FROM users WHERE id IN (${idPh})`).run(...ids);
  console.log(`Removed ${ids.length} demo user(s) and their photos/locations.`);
}

function workerSitePoint(regionCenter, slotInRegion) {
  return offsetMeters(
    regionCenter.latitude,
    regionCenter.longitude,
    150 + slotInRegion * 120,
    (slotInRegion * 53) % 360
  );
}

function insertUser(employeeId, username, globalIndex) {
  const password_hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
  const email = `${employeeId.toLowerCase()}@lonestar.local`;
  const mobile = String(9100000100 + globalIndex);

  const result = db
    .prepare(
      `INSERT INTO users (username, email, password_hash, gender, mobile_number, employee_id, employee_type)
       VALUES (?, ?, ?, ?, ?, ?, 'worker')`
    )
    .run(username, email, password_hash, 'other', mobile, employeeId);

  return result.lastInsertRowid;
}

function nextOnsite(lat, lon) {
  const step = randomSmallStepMeters();
  return {
    ...offsetMeters(lat, lon, step, randomBearing()),
    step,
  };
}

function seedWorkerTrail(userId, slotInRegion, filename, regionCenter, regionLabel, scenario) {
  const site = workerSitePoint(regionCenter, slotInRegion);
  let { latitude, longitude } = site;

  const awayMeters = 4000 + Math.random() * 3000;
  const awayPoint = offsetMeters(site.latitude, site.longitude, awayMeters, randomBearing());

  const insertPhoto = db.prepare(
    `INSERT INTO photos (user_id, filename, latitude, longitude, comment, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const insertLocation = db.prepare(
    `INSERT INTO locations (user_id, latitude, longitude, created_at) VALUES (?, ?, ?, ?)`
  );

  let hoursAgo = 48 - slotInRegion * 0.4;

  const scenarioNote =
    scenario === 'stationary'
      ? 'stationary @ site'
      : scenario === 'away'
        ? 'onsite then away from site'
        : 'onsite patrol';

  for (let p = 0; p < PHOTOS_PER_USER; p++) {
    let step = 0;
    if (scenario === 'stationary') {
      ({ latitude, longitude } = jitterMeters(site.latitude, site.longitude, 4));
      step = 0;
    } else if (scenario === 'onsite') {
      const next = nextOnsite(latitude, longitude);
      latitude = next.latitude;
      longitude = next.longitude;
      step = next.step;
    } else if (scenario === 'away') {
      if (p >= PHOTOS_PER_USER - 3) {
        ({ latitude, longitude } = jitterMeters(awayPoint.latitude, awayPoint.longitude, 15));
        step = Math.round(awayMeters);
      } else {
        const next = nextOnsite(latitude, longitude);
        latitude = next.latitude;
        longitude = next.longitude;
        step = next.step;
      }
    }

    hoursAgo -= 1.5 + Math.random() * 2;
    const created_at = isoHoursAgo(Math.max(hoursAgo, 0.5));
    const comment = `[${regionLabel}] ${scenarioNote} · check-in #${p + 1}${step ? ` · ~${step} m` : ''}`;

    insertPhoto.run(userId, filename, latitude, longitude, comment, created_at);
    insertLocation.run(userId, latitude, longitude, created_at);
  }

  latitude = site.latitude;
  longitude = site.longitude;

  for (let g = 0; g < EXTRA_GPS_PINGS_PER_USER; g++) {
    hoursAgo -= 0.4 + Math.random() * 0.8;
    const created_at = isoHoursAgo(Math.max(hoursAgo, 0.2));

    if (scenario === 'stationary') {
      ({ latitude, longitude } = jitterMeters(site.latitude, site.longitude, 2));
    } else if (scenario === 'onsite') {
      const next = nextOnsite(latitude, longitude);
      latitude = next.latitude;
      longitude = next.longitude;
    } else if (scenario === 'away') {
      if (g >= EXTRA_GPS_PINGS_PER_USER - 5) {
        ({ latitude, longitude } = jitterMeters(awayPoint.latitude, awayPoint.longitude, 10));
      } else if (g >= EXTRA_GPS_PINGS_PER_USER - 10) {
        const next = nextOnsite(latitude, longitude);
        latitude = next.latitude;
        longitude = next.longitude;
      } else {
        ({ latitude, longitude } = jitterMeters(site.latitude, site.longitude, 5));
      }
    }

    insertLocation.run(userId, latitude, longitude, created_at);
  }
}

function main() {
  const argv = process.argv.slice(2);
  const clean = argv.includes('--clean');
  if (clean) cleanDemoUsers();

  ensureSharedPhoto();
  const filename = SHARED_FILENAME;

  let created = 0;
  let skipped = 0;
  let globalIndex = 0;

  for (const region of REGION_PLAN) {
    console.log(`\n— ${region.label} · ${region.place} (${region.count} workers) —`);
    for (let s = 0; s < region.count; s++) {
      const employeeId = DEMO_EMPLOYEE_IDS[globalIndex];
      const scenario = SCENARIOS[s];
      const username = `${region.label} Worker ${s + 1}`;

      const existing = db.prepare(`SELECT id FROM users WHERE employee_id = ?`).get(employeeId);
      if (existing) {
        console.log(`Skip ${employeeId} (already exists). Use --clean or pnpm seed:fresh.`);
        skipped += 1;
        globalIndex += 1;
        continue;
      }

      const userId = insertUser(employeeId, username, globalIndex);
      seedWorkerTrail(userId, s, filename, region.center, region.label, scenario);
      created += 1;
      console.log(
        `  ${employeeId} ${username} (${scenario}) — ${PHOTOS_PER_USER} photos + ${EXTRA_GPS_PINGS_PER_USER} GPS`
      );
      globalIndex += 1;
    }
  }

  console.log('');
  console.log(`Done. Created ${created}, skipped ${skipped}.`);
  console.log(`Shared image: uploads/${SHARED_FILENAME}`);
  console.log(`Workers DEMO001–DEMO020, password ${DEMO_PASSWORD}`);
}

main();
