-- Migration 010: ensure the order bill query has the customer/order fields it depends on.
-- Safe to run repeatedly.

ALTER TABLE customers ADD COLUMN IF NOT EXISTS account_id VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS permit_numbers TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS registered_company_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS dba TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS sales_tax_id TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS has_cigarette_permit BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tobacco_permit_number TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tobacco_expire_date DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'COD';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS load_number VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_credits DECIMAL(12, 2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_deposit DECIMAL(12, 2) DEFAULT 0.00;

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_discount DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_deposit DECIMAL(10, 2) DEFAULT 0.00;
