import { readFileSync } from 'node:fs';

const checks = [
  {
    path: 'apps/web/lib/api/config.ts',
    allow: [
      'const DEFAULT_API_BASE_URL = "http://localhost:3001";',
      'const DEFAULT_API_BASE_URL = \'http://localhost:3001\';',
    ],
  },
  {
    path: 'apps/admin/lib/api/config.ts',
    allow: [
      'const DEFAULT_API_BASE_URL = "http://localhost:3001";',
      'const DEFAULT_API_BASE_URL = \'http://localhost:3001\';',
      'const DEFAULT_WEB_BASE_URL = "http://localhost:3000";',
      'const DEFAULT_WEB_BASE_URL = \'http://localhost:3000\';',
    ],
  },
  {
    path: 'apps/web/lib/config/url.ts',
    allow: [],
  },
  {
    path: 'apps/web/app/sitemap.ts',
    allow: ['resolveRequiredUrl("NEXT_PUBLIC_APP_URL", "http://localhost:3000")'],
  },
  {
    path: 'apps/web/app/robots.ts',
    allow: ['resolveRequiredUrl("NEXT_PUBLIC_APP_URL", "http://localhost:3000")'],
  },
  {
    path: 'apps/api/src/ai/model-api.service.ts',
    allow: ["return ['http://127.0.0.1:3003'];"],
  },
];

const localhostPattern = /https?:\/\/(?:localhost|127\.0\.0\.1):\d+/g;
const failures = [];

for (const entry of checks) {
  const content = readFileSync(entry.path, 'utf8');
  const matches = content.match(localhostPattern) ?? [];
  for (const found of matches) {
    const line = content
      .split('\n')
      .find((candidate) => candidate.includes(found))
      ?.trim();
    if (!line) continue;
    if (!entry.allow.some((allowed) => line.includes(allowed))) {
      failures.push(`${entry.path}: unexpected localhost literal -> ${line}`);
    }
  }
}

if (failures.length > 0) {
  console.error('URL regression check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('URL regression check passed.');
