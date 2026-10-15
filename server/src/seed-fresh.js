/**
 * Truncate app data, seed admin + WRK001, then 20 regional demo workers.
 */
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { truncateAppData } from './truncate-db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.join(__dirname, '..');

function run(script) {
  execSync(`node ${path.join(__dirname, script)}`, {
    cwd: serverRoot,
    stdio: 'inherit',
    env: process.env,
  });
}

console.log('Truncating database…');
truncateAppData();

console.log('\nSeeding admin + WRK001…');
run('seed.js');

console.log('\nSeeding 20 demo workers…');
run('seed-demo.js');

console.log('\nFresh seed complete.');
