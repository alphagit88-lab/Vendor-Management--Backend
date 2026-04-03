const bcrypt = require('bcryptjs');
const pool = require('../config/database');

async function resetPassword() {
  try {
    const password = 'test@123';
    const hash = await bcrypt.hash(password, 10);
    
    console.log('Generated hash:', hash);
    
    // Verify the hash works
    const verify = await bcrypt.compare(password, hash);
    console.log('Hash verification:', verify);

    // Update the password for test1@gmail.com
    const result = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2 RETURNING id, name, email',
      [hash, 'test1@gmail.com']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Password updated for:', result.rows[0].name, '(' + result.rows[0].email + ')');
    } else {
      console.log('❌ No user found with email test1@gmail.com');
    }

    // Also update the other staff member
    const result2 = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE role = $2 AND password_hash IS NULL OR length(password_hash) < 10 RETURNING id, name, email',
      [hash, 'staff']
    );
    
    if (result2.rows.length > 0) {
      console.log('✅ Also fixed passwords for:', result2.rows.map(r => r.name).join(', '));
    }

    // Final verification - read back and compare
    const checkResult = await pool.query('SELECT id, name, email, password_hash FROM users WHERE email = $1', ['test1@gmail.com']);
    if (checkResult.rows.length > 0) {
      const finalVerify = await bcrypt.compare(password, checkResult.rows[0].password_hash);
      console.log('✅ Final password verification for', checkResult.rows[0].email + ':', finalVerify);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

resetPassword();
