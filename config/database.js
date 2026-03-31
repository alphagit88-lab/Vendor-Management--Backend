const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
require('dotenv').config();

// EXTREMELY IMPORTANT FIX:
// This forces Neon to use WebSockets (Port 443) instead of standard TCP (Port 5432).
// This guarantees that any ISP blocks or firewalls on your PC will be completely bypassed!
neonConfig.webSocketConstructor = ws;

const isNeon = process.env.DB_HOST && process.env.DB_HOST.includes('neon.tech');

let pool;
if (isNeon) {
  const connectionString = `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}?sslmode=require`;
  pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
} else {
  // Graceful fallback to standard pg if you ever switch back to your PC's binrental_db
  const pg = require('pg');
  pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'binrental_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
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
