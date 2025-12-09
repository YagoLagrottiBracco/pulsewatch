-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  author_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  views INTEGER DEFAULT 0,
  tags TEXT[]
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Admin users policies
CREATE POLICY "Admin users can read all admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Blog posts policies
CREATE POLICY "Anyone can read published posts"
  ON blog_posts FOR SELECT
  USING (status = 'published' OR EXISTS (
    SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
  ));

CREATE POLICY "Admins can create posts"
  ON blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update posts"
  ON blog_posts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete posts"
  ON blog_posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
