const pool = require('../config/database');

class Order {
  static async create({ order_number, customer_id, user_id, total_amount, total_credits, total_deposit, status, notes, load_number, items }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const orderQuery = `
        INSERT INTO orders (order_number, customer_id, user_id, total_amount, total_credits, total_deposit, status, notes, load_number, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *
      `;
      const orderValues = [order_number, customer_id, user_id, total_amount, total_credits || 0, total_deposit || 0, status || 'pending', notes || null, load_number || null];
      const orderResult = await client.query(orderQuery, orderValues);
      const order = orderResult.rows[0];

      if (items && items.length > 0) {
        for (const item of items) {
          const itemQuery = `
            INSERT INTO order_items (order_id, item_id, quantity, unit_price, unit_discount, unit_deposit, subtotal, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          `;
          const itemValues = [order.id, item.item_id, item.quantity, item.unit_price, item.unit_discount || 0, item.unit_deposit || 0, item.subtotal];
          await client.query(itemQuery, itemValues);
        }
      }

      await client.query('COMMIT');
      return order;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(id) {
    const orderQuery = `
      SELECT o.*, c.name as customer_name, u.name as user_name
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `;
    const orderResult = await pool.query(orderQuery, [id]);
    const order = orderResult.rows[0];

    if (order) {
      const itemsQuery = `
        SELECT oi.*, i.name as item_name
        FROM order_items oi
        JOIN items i ON oi.item_id = i.id
        WHERE oi.order_id = $1
      `;
      const itemsResult = await pool.query(itemsQuery, [id]);
      order.items = itemsResult.rows;
    }

    return order;
  }

  static async findAll() {
    const query = `
      SELECT o.*, c.name as customer_name, u.name as user_name
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async updateStatus(id, status) {
    const query = `
      UPDATE orders
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM orders WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Order;
