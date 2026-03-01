import { execSync } from 'node:child_process';
import path from 'node:path';
import * as dotenv from 'dotenv';
import { getTestDatabaseUrl } from './db-utils.js';

export function setup() {
  dotenv.config({ path: path.join(process.cwd(), '.env'), quiet: true });

  const databaseUrl = getTestDatabaseUrl();
  process.env.DATABASE_URL = databaseUrl;

  // Ensure the test database is ready with a fresh migration
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
}
