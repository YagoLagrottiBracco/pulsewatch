import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://pulsewatch.click'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  // 1. Páginas estáticas (internas)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]

  // 2. Buscar páginas CTA (is_page = true) - ficam na raiz como /shopify, /woo, /nuvemshop
  const { data: ctaPages } = await supabase
    .from('blog_posts')
    .select('slug, updated_at, published_at')
    .eq('status', 'published')
    .eq('is_page', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .or(`unpublish_at.is.null,unpublish_at.gt.${now}`)

  const ctaPagesSitemap: MetadataRoute.Sitemap = (ctaPages || []).map((page) => ({
    url: `${BASE_URL}/${page.slug}`,
    lastModified: new Date(page.updated_at || page.published_at),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  // 3. Buscar posts do blog (is_page = false ou null) - ficam em /blog/[slug]
  const { data: blogPosts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at, published_at')
    .eq('status', 'published')
    .or('is_page.eq.false,is_page.is.null')
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .or(`unpublish_at.is.null,unpublish_at.gt.${now}`)

  const blogPostsSitemap: MetadataRoute.Sitemap = (blogPosts || []).map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at || post.published_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...ctaPagesSitemap, ...blogPostsSitemap]
}
