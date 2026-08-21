import { PrismaClient } from '../../../generated/prisma/client.js';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { envConfig } from './envConfig.js';

const pool = new pg.Pool({ connectionString: envConfig.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

export default prisma;
