import path from 'node:path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env'), quiet: true });
process.env.STOCK_PRICE_PROVIDER = 'mock';
