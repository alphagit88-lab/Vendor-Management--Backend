const pool = require('../config/database');

async function migrateRoles() {
  try {
    // Update all salesperson and manager roles to staff
    const result = await pool.query(
      "UPDATE users SET role = 'staff', updated_at = NOW() WHERE role IN ('salesperson', 'manager') RETURNING id, name, role"
    );
    
    if (result.rows.length > 0) {
      console.log('Updated roles for:', result.rows.map(r => `${r.name} -> ${r.role}`).join(', '));
    } else {
      console.log('No users needed role migration.');
    }

    // Show current state
    const all = await pool.query("SELECT id, name, role FROM users ORDER BY id");
    console.log('\nCurrent users:');
    all.rows.forEach(u => console.log(`  ${u.id}: ${u.name} (${u.role})`));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

migrateRoles();
