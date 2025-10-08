const { spawnSync } = require('node:child_process');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const args = [
  'rebuild',
  'better-sqlite3',
  '--runtime=electron',
  '--target=28.2.0',
  '--disturl=https://electronjs.org/headers'
];

console.log('Rebuilding better-sqlite3 against the local Electron headers...');

const result = spawnSync(npmCmd, args, { stdio: 'inherit' });

if (result.error) {
  console.error('Failed to rebuild better-sqlite3 for Electron:', result.error);
  process.exit(result.status ?? 1);
}

if (result.status !== 0) {
  console.error(`npm rebuild exited with code ${result.status}`);
  process.exit(result.status);
}

console.log('Finished rebuilding better-sqlite3 for Electron.');
