const pool = require('../config/database');

class Inventory {
  static async findAll() {
    const query = `
      SELECT i.id, i.description_name as item_name, i.item_number, i.upc, 
             inv.quantity, inv.reorder_level, inv.last_restock_at
      FROM items i
      LEFT JOIN inventory inv ON i.id = inv.item_id
      ORDER BY i.description_name ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async updateStock(item_id, quantity_changed, type, notes = null, reference_id = null, unit_cost = 0) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Update overall inventory
      const updateQuery = `
        INSERT INTO inventory (item_id, quantity, last_restock_at, updated_at)
        VALUES ($1, $2, CASE WHEN $2 > 0 THEN NOW() ELSE NULL END, NOW())
        ON CONFLICT (item_id) DO UPDATE 
        SET quantity = inventory.quantity + EXCLUDED.quantity, 
            updated_at = NOW(),
            last_restock_at = CASE WHEN $2 > 0 THEN NOW() ELSE inventory.last_restock_at END
        RETURNING *
      `;
      const updateResult = await client.query(updateQuery, [item_id, quantity_changed]);

      // 2. Log transaction with unit_cost
      const logQuery = `
        INSERT INTO inventory_logs (item_id, quantity_changed, type, reference_id, notes, unit_cost)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await client.query(logQuery, [item_id, quantity_changed, type, reference_id, notes, unit_cost]);

      // 3. Update item's core cost if it's a restock and a cost was provided
      if (type === 'RESTOCK' && unit_cost > 0) {
        await client.query('UPDATE items SET vendor_cost = $1 WHERE id = $2', [unit_cost, item_id]);
      }

      await client.query('COMMIT');
      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getLogs(item_id = null) {
    let query = `
      SELECT il.*, i.description_name as item_name
      FROM inventory_logs il
      JOIN items i ON il.item_id = i.id
    `;
    const params = [];
    if (item_id) {
      query += ` WHERE il.item_id = $1`;
      params.push(item_id);
    }
    query += ` ORDER BY il.created_at DESC LIMIT 100`;
    const result = await pool.query(query, params);
    return result.rows;
  }
}

module.exports = Inventory;
