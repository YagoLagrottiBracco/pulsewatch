import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BlogPostClient from './BlogPostClient'

type Props = {
  params: {
    slug: string
  }
}

async function getPostBySlug(slug: string) {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .or(`unpublish_at.is.null,unpublish_at.gt.${now}`)
    .single()

  return data as any | null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://pulsewatch.click'
  const metadataBase = new URL(appUrl)
  const post = await getPostBySlug(params.slug)

  if (!post) {
    const fallbackTitle = 'Post não encontrado | PulseWatch Blog'
    const fallbackDescription = 'O post que você tentou acessar não foi encontrado.'
    return {
      metadataBase,
      title: fallbackTitle,
      description: fallbackDescription,
      openGraph: {
        title: fallbackTitle,
        description: fallbackDescription,
        url: `${appUrl}/blog`,
        siteName: 'PulseWatch',
        type: 'article',
      },
      alternates: {
        canonical: `${appUrl}/blog`,
      },
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const title = post.seo_title || post.title
  const description = post.seo_description || post.excerpt || post.title
  const rawOgImage = post.seo_og_image || post.cover_image || null
  
  // Imagem padrão para OG se não houver imagem específica
  const defaultOgImage = `${appUrl}/og-image.png`
  
  const ogImage = rawOgImage
    ? rawOgImage.startsWith('http')
      ? rawOgImage
      : `${appUrl}/${rawOgImage.replace(/^\/+/, '')}`
    : defaultOgImage

  const keywordsArray = post.seo_keywords
    ? (post.seo_keywords as string)
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
    : undefined

  const canonicalUrl = `${appUrl}/blog/${post.slug}`

  return {
    metadataBase,
    title,
    description,
    keywords: keywordsArray,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'PulseWatch',
      type: 'article',
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at || undefined,
      tags: Array.isArray(post.tags) ? post.tags : undefined,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/png',
        },
      ],
      locale: 'pt_BR',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      site: '@pulsewatch',
      creator: '@pulsewatch',
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPostBySlug(params.slug)

  if (!post) {
    redirect('/blog')
  }

  return <BlogPostClient post={post} />
}
