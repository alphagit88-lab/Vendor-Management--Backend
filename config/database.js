const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}?sslmode=require`,
  ssl: { rejectUnauthorized: false },
  max: 10
});

// Global debug listener
pool.on('connect', () => {
  console.log(isNeon ? '⚡ Connected to Neon Database over secure WebSocket (Port 443)' : '✅ Connected to Local Database (Port 5432)');
});

pool.on('error', (err) => {
  console.error('❌ Connection dropped (This is normal when going idle over wifi).', err.message);
  // We do not crash the server here so it can auto-reconnect on the next request.
});

module.exports = pool;
