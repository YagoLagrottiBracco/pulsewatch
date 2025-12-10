import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import BlogPageClient from './BlogPageClient'

const BLOG_TITLE = 'Blog PulseWatch – Monitoramento inteligente para e-commerce'
const BLOG_DESCRIPTION =
  'Alertas inteligentes, tutoriais e guias práticos para manter sua loja virtual vendendo 24/7.'

async function getPublishedPosts() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  return data || []
}

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://pulsewatch.click'

  const canonicalUrl = `${appUrl}/blog`

  return {
    title: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title: BLOG_TITLE,
      description: BLOG_DESCRIPTION,
      siteName: 'PulseWatch',
      images: [
        {
          url: `${appUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: BLOG_TITLE,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: BLOG_TITLE,
      description: BLOG_DESCRIPTION,
      images: [`${appUrl}/og-image.png`],
      site: '@pulsewatch',
    },
  }
}

export default async function BlogPage() {
  const posts = await getPublishedPosts()
  return <BlogPageClient initialPosts={posts} />
}
