'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LogoIcon } from '@/components/ui/logo'
import { Menu, X } from 'lucide-react'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/50 shadow-2xl shadow-primary/5 transition-all duration-300 ${
        scrolled ? 'h-16' : 'h-24'
      }`}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />

      {/* Glass effect border */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="container relative h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <LogoIcon
              className={`text-primary group-hover:scale-110 transition-all duration-300 relative z-10 ${
                scrolled ? 'h-8 w-8' : 'h-12 w-12'
              }`}
            />
          </div>
          <span
            className={`font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent transition-all duration-300 ${
              scrolled ? 'text-xl' : 'text-3xl'
            }`}
          >
            PulseWatch
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-10">
          <a href="#features" className="relative text-sm font-semibold hover:text-primary transition-all duration-300 group">
            <span className="relative z-10">Recursos</span>
            <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-primary to-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          </a>
          <a href="#platforms" className="relative text-sm font-semibold hover:text-primary transition-all duration-300 group">
            <span className="relative z-10">Plataformas</span>
            <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-primary to-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          </a>
          <a href="#pricing" className="relative text-sm font-semibold hover:text-primary transition-all duration-300 group">
            <span className="relative z-10">Preços</span>
            <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-primary to-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          </a>
          <a href="#faq" className="relative text-sm font-semibold hover:text-primary transition-all duration-300 group">
            <span className="relative z-10">FAQ</span>
            <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-primary to-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          </a>
          <Link href="/blog" className="relative text-sm font-semibold hover:text-primary transition-all duration-300 group">
            <span className="relative z-10">Blog</span>
            <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-primary to-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          </Link>

          <div className="flex items-center gap-4 ml-4 pl-4 border-l border-border/40">
            <Link href="/auth/login">
              <Button variant="ghost" className="hover:bg-primary/10 hover:scale-105 transition-all duration-300 font-semibold">
                Entrar
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="relative bg-gradient-to-r from-primary via-purple-600 to-primary bg-size-200 hover:bg-right shadow-2xl hover:shadow-primary/50 transition-all duration-500 font-bold overflow-hidden group">
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className="relative">Começar Grátis</span>
              </Button>
            </Link>
          </div>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menu"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border/40 shadow-lg">
          <nav className="container flex flex-col py-4 gap-1">
            <a href="#features" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm font-semibold rounded-md hover:bg-muted transition-colors">
              Recursos
            </a>
            <a href="#platforms" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm font-semibold rounded-md hover:bg-muted transition-colors">
              Plataformas
            </a>
            <a href="#pricing" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm font-semibold rounded-md hover:bg-muted transition-colors">
              Preços
            </a>
            <a href="#faq" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm font-semibold rounded-md hover:bg-muted transition-colors">
              FAQ
            </a>
            <Link href="/blog" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm font-semibold rounded-md hover:bg-muted transition-colors">
              Blog
            </Link>
            <div className="mt-3 pt-3 border-t border-border/40 flex flex-col gap-2">
              <Link href="/auth/login" onClick={() => setMenuOpen(false)}>
                <Button variant="outline" className="w-full font-semibold">
                  Entrar
                </Button>
              </Link>
              <Link href="/auth/signup" onClick={() => setMenuOpen(false)}>
                <Button className="w-full font-bold bg-gradient-to-r from-primary via-purple-600 to-primary">
                  Começar Grátis
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
