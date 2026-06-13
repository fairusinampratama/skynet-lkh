import { spawnSync } from 'node:child_process';

const deadline = Date.now() + 30_000;

function isReady() {
  const result = spawnSync('docker', [
    'compose',
    '-f',
    'docker-compose.test.yml',
    'exec',
    '-T',
    'postgres',
    'pg_isready',
    '-U',
    'lkh',
    '-d',
    'lkh_test'
  ]);
  return result.status === 0;
}

while (Date.now() < deadline) {
  if (isReady()) {
    process.exit(0);
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}

console.error('Timed out waiting for test PostgreSQL.');
process.exit(1);
