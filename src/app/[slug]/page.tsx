import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CTAPageClient from './CTAPageClient'

type Props = {
  params: {
    slug: string
  }
}

async function getPageBySlug(slug: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .eq('is_page', true)
    .single()

  return data as any | null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://pulsewatch.click'
  const metadataBase = new URL(appUrl)
  const page = await getPageBySlug(params.slug)

  if (!page) {
    return {
      metadataBase,
      title: 'Página não encontrada | PulseWatch',
      robots: { index: false, follow: false },
    }
  }

  const title = page.seo_title || page.title
  const description = page.seo_description || page.excerpt || page.title
  const rawOgImage = page.seo_og_image || page.cover_image || null
  const ogImage = rawOgImage
    ? rawOgImage.startsWith('http')
      ? rawOgImage
      : `${appUrl}/${rawOgImage.replace(/^\/+/, '')}`
    : undefined

  const keywordsArray = page.seo_keywords
    ? (page.seo_keywords as string)
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
    : undefined

  const canonicalUrl = `${appUrl}/${page.slug}`

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
      type: 'website',
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
      site: '@pulsewatch',
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function CTAPage({ params }: Props) {
  const page = await getPageBySlug(params.slug)

  if (!page) {
    notFound()
  }

  return <CTAPageClient page={page} />
}
