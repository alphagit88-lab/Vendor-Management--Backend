const pool = require('../config/database');

class Item {
  static async create({ description_name, price, description, item_number, upc, cost, quantity_size, vendor_cost, category_id }) {
    const query = `
      INSERT INTO items (description_name, price, description, item_number, upc, cost, quantity_size, vendor_cost, category_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `;
    const values = [description_name, price, description, item_number, upc, cost, quantity_size, vendor_cost, category_id || null];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `SELECT * FROM items WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findAll() {
    const query = `
      SELECT i.*, c.name as category_name
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      ORDER BY i.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async update(id, { description_name, price, description, item_number, upc, cost, quantity_size, vendor_cost, category_id }) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    const fields = { description_name, price, description, item_number, upc, cost, quantity_size, vendor_cost, category_id };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates.push(`${key} = $${paramCount++}`);
        values.push((value === '' || value === null) ? null : value);
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
