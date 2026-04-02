require('dotenv').config();
const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
let pool;

if (isVercel) {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10
  });
} else {
  // Local logic using serverless wrapper for ISP bypass
  const { Pool, neonConfig } = require('@neondatabase/serverless');
  const ws = require('ws');
  neonConfig.webSocketConstructor = ws;
  pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}?sslmode=require`,
    max: 5
  });
}

// Global debug listener
pool.on('connect', () => {
  console.log('✅ Connected to database');
});

pool.on('error', (err) => {
  console.error('❌ Connection dropped.', err.message);
});

module.exports = pool;
