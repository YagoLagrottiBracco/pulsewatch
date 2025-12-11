'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Eye, ArrowLeft, Share2 } from 'lucide-react'
import { LogoIcon } from '@/components/ui/logo'

interface BlogPostClientProps {
  post: any
}

export default function BlogPostClient({ post }: BlogPostClientProps) {
  const router = useRouter()

  const handleShare = () => {
    if (!post) return

    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt || post.title,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copiado para a área de transferência!')
    }
  }

  if (!post) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <LogoIcon className="h-14 w-14 text-primary" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">PulseWatch</span>
            </Link>
            <nav className="flex gap-6">
              <Link href="/blog" className="text-sm font-medium text-primary">
                Blog
              </Link>
              <Link href="/auth/login" className="text-sm hover:text-primary transition">
                Login
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Article */}
      <article className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.push('/blog')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o Blog
          </Button>

          {/* Cover Image */}
          {post.cover_image && (
            <div className="w-full flex justify-center mb-8">
              <img
                src={post.cover_image}
                alt={post.title}
                className="rounded-xl max-w-full h-auto"
              />
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>

          {/* Meta */}
          <div className="flex items-center gap-4 mb-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                {post.published_at && new Date(post.published_at).toLocaleDateString('pt-BR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="text-sm">{post.views || 0} visualizações</span>
            </div>
            <span>•</span>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </div>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* Divider */}
          <div className="border-t mb-8" />

          {/* Content */}
          <div
            className="prose prose-lg prose-slate dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Divider */}
          <div className="border-t mt-12 pt-8">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => router.push('/blog')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para o Blog
              </Button>
              <Button onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="mt-auto border-t py-8 bg-background">
        <div className="container mx-auto px-4 max-w-6xl text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PulseWatch. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
