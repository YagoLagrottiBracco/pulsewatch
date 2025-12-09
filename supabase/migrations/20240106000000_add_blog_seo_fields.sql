-- Add SEO fields to blog_posts
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_og_image TEXT,
  ADD COLUMN IF NOT EXISTS seo_keywords TEXT;
