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

  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  return data as any | null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.slug)

  if (!post) {
    return {
      title: 'Post não encontrado | PulseWatch Blog',
      description: 'O post que você tentou acessar não foi encontrado.',
    }
  }

  const title = post.seo_title || post.title
  const description = post.seo_description || post.excerpt || ''
  const ogImage = post.seo_og_image || post.cover_image || undefined
  const keywords = post.seo_keywords
    ? (post.seo_keywords as string)
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
    : undefined
  const url = `https://pulsewatch.click/blog/${post.slug}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    keywords,
    alternates: {
      canonical: url,
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
