'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Eye, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoIcon } from '@/components/ui/logo'

interface BlogPageClientProps {
  initialPosts: any[]
}

export default function BlogPageClient({ initialPosts }: BlogPageClientProps) {
  const posts = useMemo(() => initialPosts || [], [initialPosts])

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/20">
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

      <section className="py-20 text-center">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-5xl font-bold mb-6">
            Blog do <span className="text-primary">PulseWatch</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Dicas, tutoriais e novidades sobre monitoramento de e-commerce
          </p>
        </div>
      </section>

      <section className="pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold">Últimos artigos</h2>
              <p className="text-muted-foreground">
                Conteúdo prático para manter sua loja no ar 24/7
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/auth/signup">
                Criar conta
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          {posts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">Nenhum post publicado ainda</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    {post.cover_image && (
                      <div className="w-full rounded-t-lg bg-muted flex justify-center">
                        <img
                          src={post.cover_image}
                          alt={post.title}
                          className="max-w-full h-auto rounded-t-lg"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {post.tags?.slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <CardTitle>{post.title}</CardTitle>
                      <CardDescription className="line-clamp-3">
                        {post.excerpt || 'Sem resumo disponível'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {post.published_at
                            ? new Date(post.published_at).toLocaleDateString('pt-BR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Sem data'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          {post.views || 0} views
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="mt-auto border-t py-8 bg-background">
        <div className="container mx-auto px-4 max-w-6xl text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PulseWatch. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
