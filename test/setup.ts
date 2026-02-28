import path from 'node:path';
import * as dotenv from 'dotenv';
import { getTestDatabaseUrl } from './db-utils.js';

dotenv.config({ path: path.join(process.cwd(), '.env'), quiet: true });
process.env.STOCK_PRICE_PROVIDER = 'mock';
process.env.DATABASE_URL = getTestDatabaseUrl();
