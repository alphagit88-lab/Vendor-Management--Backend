-- Migration 009: validate order-related foreign keys when existing data is clean.
-- Leaves a constraint unvalidated if historical rows would violate it.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_customer_id_fkey'
      AND NOT convalidated
  ) AND NOT EXISTS (
    SELECT 1
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    WHERE o.customer_id IS NOT NULL AND c.id IS NULL
  ) THEN
    ALTER TABLE orders VALIDATE CONSTRAINT orders_customer_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_user_id_fkey'
      AND NOT convalidated
  ) AND NOT EXISTS (
    SELECT 1
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    WHERE o.user_id IS NOT NULL AND u.id IS NULL
  ) THEN
    ALTER TABLE orders VALIDATE CONSTRAINT orders_user_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'order_items_item_id_fkey'
      AND NOT convalidated
  ) AND NOT EXISTS (
    SELECT 1
    FROM order_items oi
    LEFT JOIN items i ON i.id = oi.item_id
    WHERE oi.item_id IS NOT NULL AND i.id IS NULL
  ) THEN
    ALTER TABLE order_items VALIDATE CONSTRAINT order_items_item_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'order_items_order_id_fkey'
      AND NOT convalidated
  ) AND NOT EXISTS (
    SELECT 1
    FROM order_items oi
    LEFT JOIN orders o ON o.id = oi.order_id
    WHERE oi.order_id IS NOT NULL AND o.id IS NULL
  ) THEN
    ALTER TABLE order_items VALIDATE CONSTRAINT order_items_order_id_fkey;
  END IF;
END $$;
