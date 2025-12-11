'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'

interface CTAPageClientProps {
  page: any
}

export default function CTAPageClient({ page }: CTAPageClientProps) {
  if (!page) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              <span className="text-2xl font-bold">PulseWatch</span>
            </Link>
            <nav className="flex gap-6">
              <Link href="/blog" className="text-sm hover:text-primary transition">
                Blog
              </Link>
              <Link href="/auth/login" className="text-sm hover:text-primary transition">
                Login
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Cover Image */}
          {page.cover_image && (
            <div className="w-full flex justify-center mb-8">
              <img
                src={page.cover_image}
                alt={page.title}
                className="rounded-xl max-w-full h-auto"
              />
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">{page.title}</h1>

          {/* Excerpt */}
          {page.excerpt && (
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed text-center">
              {page.excerpt}
            </p>
          )}

          {/* Divider */}
          <div className="border-t mb-8" />

          {/* Content */}
          <div
            className="prose prose-lg prose-slate dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />

          {/* CTA Button */}
          <div className="mt-12 text-center">
            <Link href="/auth/register">
              <Button size="lg" className="text-lg px-8 py-6">
                Começar Agora
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-background">
        <div className="container mx-auto px-4 max-w-6xl text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PulseWatch. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
