const pool = require('../config/database');

class Inventory {
  /**
   * Returns overall inventory status by merging warehouse and salespeople quantities.
   */
  static async findAll() {
    const query = `
      SELECT 
        i.id,
        i.description_name as item_name,
        i.item_number,
        c.name as category_name,
        COALESCE(inv.quantity, 0) as warehouse_quantity,
        (SELECT COALESCE(SUM(quantity), 0) FROM salesperson_inventory WHERE item_id = i.id) as salesperson_quantity,
        (COALESCE(inv.quantity, 0) + (SELECT COALESCE(SUM(quantity), 0) FROM salesperson_inventory WHERE item_id = i.id)) as total_quantity,
        COALESCE(inv.reorder_level, 10) as reorder_level,
        COALESCE((
          SELECT json_agg(json_build_object(
            'user_id', si.user_id,
            'user_name', u.name,
            'location', u.inventory_location,
            'quantity', si.quantity
          ))
          FROM salesperson_inventory si
          JOIN users u ON si.user_id = u.id
          WHERE si.item_id = i.id
        ), '[]') as sub_inventories
      FROM items i
      LEFT JOIN inventory inv ON i.id = inv.item_id
      LEFT JOIN categories c ON i.category_id = c.id
      ORDER BY i.description_name ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Core logic for moving stock:
   * - RESTOCK: Standard addition to warehouse.
   * - ADJUSTMENT: Manual warehouse inventory correction (can be negative).
   * - ASSIGNMENT: Move from warehouse to salesperson.
   * - SALE: Sale by salesperson (decrements salesperson stock).
   */
  static async updateStock({ item_id, quantity, type, notes, user_actor_id, unit_cost, salesperson_id }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Transactional Update
      if (type === 'RESTOCK' || type === 'ADJUSTMENT') {
        // Warehouse change
        await client.query(`
          INSERT INTO inventory (item_id, quantity, updated_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (item_id) 
          DO UPDATE SET 
            quantity = inventory.quantity + EXCLUDED.quantity,
            updated_at = NOW()
        `, [item_id, quantity]);
      } 
      else if (type === 'ASSIGNMENT') {
        if (!salesperson_id) throw new Error('Salesperson ID required for assignment');
        
        // Deduction from Warehouse
        const res = await client.query(`
            UPDATE inventory 
            SET quantity = quantity - $1 
            WHERE item_id = $2 
            RETURNING quantity
        `, [Math.abs(quantity), item_id]);
        
        if (res.rowCount === 0 || res.rows[0].quantity < 0) {
            throw new Error('Insufficient stock in warehouse for assignment');
        }

        // Addition to Salesperson Inventory
        await client.query(`
            INSERT INTO salesperson_inventory (item_id, user_id, quantity, updated_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (item_id, user_id)
            DO UPDATE SET 
                quantity = salesperson_inventory.quantity + EXCLUDED.quantity,
                updated_at = NOW()
        `, [item_id, salesperson_id, Math.abs(quantity)]);
      }
      else if (type === 'SALE') {
          if (!salesperson_id) throw new Error('Salesperson ID required for sales tracking');
          
          // Deduction from Salesperson Stock
          const res = await client.query(`
              UPDATE salesperson_inventory 
              SET quantity = quantity - $1 
              WHERE item_id = $2 AND user_id = $3
              RETURNING quantity
          `, [Math.abs(quantity), item_id, salesperson_id]);

          if (res.rowCount === 0 || res.rows[0].quantity < 0) {
              throw new Error('Insufficient stock with salesperson for this sale');
          }
      }

      // 2. Log Entry
      await client.query(`
        INSERT INTO inventory_logs (item_id, quantity_changed, type, notes, unit_cost, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [item_id, quantity, type, notes, unit_cost]);

      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Inventory Update Error:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  static async getLogs(item_id = null) {
    let query = `
      SELECT 
        l.*, 
        i.description_name as item_name,
        i.item_number
      FROM inventory_logs l
      LEFT JOIN items i ON l.item_id = i.id
    `;
    const params = [];
    if (item_id) {
      query += ` WHERE l.item_id = $1`;
      params.push(item_id);
    }
    query += ` ORDER BY l.created_at DESC LIMIT 100`;
    const result = await pool.query(query, params);
    return result.rows;
  }
}

module.exports = Inventory;
