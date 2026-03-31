const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function importDb() {
  const dbName = process.env.DB_NAME || 'binrental_db';
  const sqlFile = path.resolve(__dirname, '../vendor_db.sql');

  // Connection to system DB to create the target DB
  const systemClient = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres',
  });

  try {
    await systemClient.connect();
    
    // Check if DB exists
    const checkRes = await systemClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    if (checkRes.rowCount === 0) {
      console.log(`Creating database ${dbName}...`);
      await systemClient.query(`CREATE DATABASE ${dbName}`);
      console.log('✅ Base created.');
    } else {
      console.log(`Database ${dbName} already exists.`);
    }
    await systemClient.end();

    // Now connect to the new DB and import SQL
    const targetClient = new Client({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: dbName,
    });

    await targetClient.connect();
    console.log(`Importing schema from ${sqlFile}...`);
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolons for basic execution? 
    // Actually, it might have many triggers/etc.
    // Use the whole block if possible, or execute piece by piece.
    // Better yet, use a shell-based psql call since vendor_db.sql is a dump.
    
    await targetClient.end();
    
    // Switch to shell for import as it's a pg_dump
    const { execSync } = require('child_process');
    const psqlPath = '"C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe"';
    console.log('Starting full import via psql...');
    
    process.env.PGPASSWORD = process.env.DB_PASSWORD;
    const cmd = `${psqlPath} -U ${process.env.DB_USER} -d ${dbName} -f "${sqlFile}"`;
    execSync(cmd, { stdio: 'inherit' });
    
    console.log('✅ Import complete!');
  } catch (err) {
    console.error('❌ Error during import:', err);
    process.exit(1);
  }
}

importDb();
