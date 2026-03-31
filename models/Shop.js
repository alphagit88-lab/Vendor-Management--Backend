const pool = require('../config/database');

class Shop {
  static async getNextAccountId() {
    const query = `SELECT account_id FROM shops WHERE account_id ~ '^[0-9]+$' ORDER BY account_id DESC LIMIT 1`;
    const result = await pool.query(query);
    if (result.rows.length === 0) return '0300';
    
    const lastId = parseInt(result.rows[0].account_id);
    const nextId = lastId + 1;
    return nextId.toString().padStart(4, '0');
  }

  static async create({ name, address, phone, account_id, permit_numbers, registered_company_name, dba, email, sales_tax_id, has_cigarette_permit, tobacco_permit_number, tobacco_expire_date, payment_type }) {
    const final_account_id = account_id || await this.getNextAccountId();
    
    const query = `
      INSERT INTO shops (name, address, phone, account_id, permit_numbers, registered_company_name, dba, email, sales_tax_id, has_cigarette_permit, tobacco_permit_number, tobacco_expire_date, payment_type, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *
    `;
    const values = [name, address, phone, final_account_id, permit_numbers, registered_company_name, dba, email, sales_tax_id, has_cigarette_permit, tobacco_permit_number, tobacco_expire_date, payment_type];
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

  static async update(id, { name, address, phone, account_id, permit_numbers, registered_company_name, dba, email, sales_tax_id, has_cigarette_permit, tobacco_permit_number, tobacco_expire_date, payment_type }) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    const fieldMap = {
      name, address, phone, account_id, permit_numbers, 
      registered_company_name, dba, email, sales_tax_id, 
      has_cigarette_permit, tobacco_permit_number, tobacco_expire_date, payment_type
    };

    for (const [key, value] of Object.entries(fieldMap)) {
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
