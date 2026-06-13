import path from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = dirname(dirname(fileURLToPath(import.meta.url)));

if (!process.argv[2] && !process.env.SMOKE_BASE_URL) {
  process.env.SMOKE_BASE_URL = process.env.CRASHOUT_PRODUCTION_URL ?? 'https://crashout-euq.pages.dev/';
}

if (!process.env.SMOKE_OUT_DIR) {
  process.env.SMOKE_OUT_DIR = path.join(projectDir, '../../docs/qa/production-smoke');
}

await import('./cockpit-smoke.mjs');
