-- Add scheduling fields to blog_posts
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS publish_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS unpublish_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient date filtering
CREATE INDEX IF NOT EXISTS idx_blog_posts_publish_at ON blog_posts(publish_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_unpublish_at ON blog_posts(unpublish_at);

-- Update existing published posts to have publish_at set to published_at
UPDATE blog_posts
SET publish_at = published_at
WHERE status = 'published' AND publish_at IS NULL;

-- Comment explaining the scheduling logic
COMMENT ON COLUMN blog_posts.publish_at IS 'When the post should go live. NULL means publish immediately when status is published';
COMMENT ON COLUMN blog_posts.unpublish_at IS 'When the post should be automatically unpublished. NULL means never unpublish';
