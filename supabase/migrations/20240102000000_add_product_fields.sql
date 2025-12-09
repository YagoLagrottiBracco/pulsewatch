-- Add product_url and category fields to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS product_url TEXT,
ADD COLUMN IF NOT EXISTS category TEXT;
