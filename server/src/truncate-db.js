import { db } from './db.js';

/** Removes all users, photos, and locations. Keeps settings rows. */
export function truncateAppData() {
  db.exec(`
    DELETE FROM photos;
    DELETE FROM locations;
    DELETE FROM users;
    DELETE FROM sqlite_sequence WHERE name IN ('users', 'photos', 'locations');
  `);
}

if (process.argv[1]?.endsWith('truncate-db.js')) {
  truncateAppData();
  console.log('Truncated users, photos, and locations (settings unchanged).');
}
