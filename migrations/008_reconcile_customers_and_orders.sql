-- Migration 008: reconcile customers/orders schema with current backend code.
-- Safe to re-run on databases that were partially updated by hand.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'shops'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'customers'
  ) THEN
    ALTER TABLE shops RENAME TO customers;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'customers'
  ) THEN
    CREATE TABLE customers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      address TEXT NOT NULL,
      phone VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  END IF;
END $$;

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

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'shop_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE orders RENAME COLUMN shop_id TO customer_id;
  END IF;
END $$;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS load_number VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_credits DECIMAL(12, 2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_deposit DECIMAL(12, 2) DEFAULT 0.00;

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_discount DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_deposit DECIMAL(10, 2) DEFAULT 0.00;

CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_unique_idx
  ON orders(order_number);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_customer_id_fkey'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_user_id_fkey'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'order_items_order_id_fkey'
  ) THEN
    ALTER TABLE order_items
      ADD CONSTRAINT order_items_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'order_items_item_id_fkey'
  ) THEN
    ALTER TABLE order_items
      ADD CONSTRAINT order_items_item_id_fkey
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL NOT VALID;
  END IF;
END $$;
