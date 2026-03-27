const pool = require('../config/database');

class Shop {
  static async create({ name, address, contact, account_id, permit_numbers }) {
    const query = `
      INSERT INTO shops (name, address, contact, account_id, permit_numbers, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    const values = [name, address, contact, account_id, permit_numbers];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `SELECT * FROM shops WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findAll() {
    const query = `SELECT * FROM shops ORDER BY created_at DESC`;
    const result = await pool.query(query);
    return result.rows;
  }

  static async update(id, { name, address, contact, account_id, permit_numbers }) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (address !== undefined) {
      updates.push(`address = $${paramCount++}`);
      values.push(address);
    }
    if (contact !== undefined) {
      updates.push(`contact = $${paramCount++}`);
      values.push(contact);
    }
    if (account_id !== undefined) {
      updates.push(`account_id = $${paramCount++}`);
      values.push(account_id);
    }
    if (permit_numbers !== undefined) {
      updates.push(`permit_numbers = $${paramCount++}`);
      values.push(permit_numbers);
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE shops 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM shops WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Shop;
