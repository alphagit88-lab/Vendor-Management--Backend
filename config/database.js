require('dotenv').config();
const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
let pool;

if (isVercel) {
  // Use standard pg for Vercel
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10
  });
} else {
  // Use neon-serverless with ws fix for Local development
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
  console.log(isNeon ? '⚡ Connected to Neon Database over secure WebSocket (Port 443)' : '✅ Connected to Local Database (Port 5432)');
});

pool.on('error', (err) => {
  console.error('❌ Connection dropped (This is normal when going idle over wifi).', err.message);
  // We do not crash the server here so it can auto-reconnect on the next request.
});

module.exports = pool;
