const pool = require('../config/database');

async function seedMigrationHistory() {
  // Create tracking table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Mark old migrations as already applied
  const oldMigrations = [
    '001_initial_schema.sql',
    '002_add_orders.sql',
    '003_add_bill_fields.sql',
    '004_update_shop_fields.sql',
    '005_update_item_fields.sql'
  ];

  for (const m of oldMigrations) {
    await pool.query(
      'INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
      [m]
    );
  }

  console.log('✅ Marked old migrations (001-005) as already applied.');
  process.exit(0);
}

seedMigrationHistory().catch(e => { console.error(e); process.exit(1); });
