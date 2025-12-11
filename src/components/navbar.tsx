'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LogoIcon } from '@/components/ui/logo'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

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
      </div>
    </header>
  )
}
