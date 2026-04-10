const pool = require('../config/database');

class Order {
  static async create({ order_number, customer_id, user_id, total_amount, total_credits, total_deposit, status, notes, load_number, items }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const orderQuery = `
        INSERT INTO orders (order_number, customer_id, user_id, total_amount, total_credits, total_deposit, status, notes, load_number, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *
      `;
      const orderValues = [
        order_number,
        customer_id,
        user_id,
        total_amount,
        total_credits || 0,
        total_deposit || 0,
        status || 'pending',
        notes || null,
        load_number || null,
      ];
      const orderResult = await client.query(orderQuery, orderValues);
      const order = orderResult.rows[0];

      if (items && items.length > 0) {
        const Inventory = require('./Inventory');
        for (const item of items) {
          if (Math.abs(Number(item.quantity || 0)) > 10) {
            throw new Error(`Quantity limit exceeded for item ${item.item_id}. Maximum allowed is 10.`);
          }

          const unitPrice = Number(item.unit_price ?? item.price ?? 0);
          const unitDiscount = Number(item.unit_discount ?? item.discount ?? 0);
          const unitDeposit = Number(item.unit_deposit ?? item.deposit ?? 0);
          const subtotal = Number(item.subtotal ?? unitPrice * Number(item.quantity || 0));

          const itemQuery = `
            INSERT INTO order_items (order_id, item_id, quantity, unit_price, subtotal, unit_discount, unit_deposit)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `;
          const itemValues = [order.id, item.item_id, item.quantity, unitPrice, subtotal, unitDiscount, unitDeposit];
          await client.query(itemQuery, itemValues);

          await Inventory.updateStock({
            item_id: item.item_id,
            quantity: -Math.abs(Number(item.quantity || 0)),
            type: 'SALE',
            notes: `Sale - Order #${order_number}`,
            salesperson_id: user_id,
            user_actor_id: user_id,
          }, client);
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
    const numericId = parseInt(id, 10);
    const query = `
      SELECT o.*, c.name as customer_name, u.name as user_name,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id', oi.id,
          'item_id', oi.item_id,
          'item_name', i.description_name,
          'item_number', i.item_number,
          'upc', i.upc,
          'quantity_size', i.quantity_size,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'unit_discount', oi.unit_discount,
          'unit_deposit', oi.unit_deposit,
          'subtotal', oi.subtotal
        ))
        FROM order_items oi
        JOIN items i ON oi.item_id = i.id
        WHERE oi.order_id = o.id
      ), '[]'::json) as items
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `;
    const result = await pool.query(query, [numericId]);
    return result.rows[0];
  }

  static async findBillById(id) {
    const numericId = parseInt(id, 10);
    const orderQuery = `
      SELECT
        o.id,
        o.order_number,
        o.customer_id,
        o.user_id,
        o.total_amount,
        o.total_credits,
        o.total_deposit,
        o.status,
        o.notes,
        o.load_number,
        o.created_at,
        c.account_id,
        c.dba,
        c.name as customer_name,
        c.address as customer_address,
        c.phone as customer_phone,
        c.registered_company_name,
        c.permit_numbers,
        c.payment_type,
        c.tobacco_permit_number,
        c.tobacco_expire_date,
        c.sales_tax_id,
        u.name as salesrep_name,
        u.phone as salesrep_phone,
        u.inventory_location as salesrep_location
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `;
    const orderResult = await pool.query(orderQuery, [numericId]);
    const order = orderResult.rows[0];

    if (!order) {
      return null;
    }

    const itemsQuery = `
      SELECT
        oi.id,
        oi.item_id,
        oi.quantity,
        oi.unit_price,
        oi.unit_discount,
        oi.unit_deposit,
        oi.subtotal,
        i.item_number,
        i.description_name,
        i.quantity_size,
        i.upc
      FROM order_items oi
      LEFT JOIN items i ON oi.item_id = i.id
      WHERE oi.order_id = $1
      ORDER BY oi.id ASC
    `;
    const itemResult = await pool.query(itemsQuery, [numericId]);

    return {
      ...order,
      items: itemResult.rows,
    };
  }

  static async findAll(userId = null) {
    let query = `
      SELECT o.*, c.name as customer_name, u.name as user_name
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON o.user_id = u.id
    `;
    const values = [];
    if (userId) {
      query += ' WHERE o.user_id = $1';
      values.push(userId);
    }
    query += ' ORDER BY o.created_at DESC';
    const result = await pool.query(query, values);
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
