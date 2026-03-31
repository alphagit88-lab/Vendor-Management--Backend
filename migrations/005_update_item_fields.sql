-- Migration: 005_update_item_fields.sql
-- Description: Adds specialized catalog fields for better product tracking.

DO $$
BEGIN
    -- Product Dimension Fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='items' AND column_name='quantity_size') THEN
        ALTER TABLE items ADD COLUMN quantity_size TEXT;
    END IF;

    -- Financial Fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='items' AND column_name='cost') THEN
        ALTER TABLE items ADD COLUMN cost DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Rename logic (Ensure name is clearly description_name if desired, or just map in code)
    -- The user requested 'Description name'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='items' AND column_name='name') THEN
        ALTER TABLE items RENAME COLUMN name TO description_name;
    END IF;

    -- Item number (Rename SKU to item_number)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='items' AND column_name='sku') THEN
        ALTER TABLE items RENAME COLUMN sku TO item_number;
    END IF;

END $$;
