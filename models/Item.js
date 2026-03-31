const pool = require('../config/database');

class Item {
  static async create({ description_name, price, description, item_number, upc, cost, quantity_size }) {
    const query = `
      INSERT INTO items (description_name, price, description, item_number, upc, cost, quantity_size, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;
    const values = [description_name, price, description, item_number, upc, cost, quantity_size];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `SELECT * FROM items WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findAll() {
    const query = `SELECT * FROM items ORDER BY created_at DESC`;
    const result = await pool.query(query);
    return result.rows;
  }

  static async update(id, { description_name, price, description, item_number, upc, cost, quantity_size }) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    const fields = { description_name, price, description, item_number, upc, cost, quantity_size };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates.push(`${key} = $${paramCount++}`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      return await this.findById(id);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE items 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM items WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Item;
