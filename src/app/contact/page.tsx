'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/navbar'
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react'

export default function ContactPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setLoading(false)
    setSuccess(true)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 pt-24">
        {/* Hero Section */}
        <section className="container py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-6" variant="outline">
              <MessageSquare className="h-3 w-3 mr-1" />
              Contato
            </Badge>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
              Fale Conosco
              <span className="block bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Estamos Aqui Para Ajudar
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Tem alguma dúvida, sugestão ou precisa de ajuda? Nossa equipe está pronta para te atender.
            </p>
          </div>
        </section>

        {/* Contact Info + Form */}
        <section className="container pb-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Contact Info Cards */}
              <div className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold mb-1">Email</h3>
                        <p className="text-sm text-muted-foreground mb-2">Respondemos em até 24h</p>
                        <a href="mailto:contato@pulsewatch.click" className="text-sm text-primary hover:underline">
                          contato@pulsewatch.click
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold mb-1">Chat</h3>
                        <p className="text-sm text-muted-foreground mb-2">Suporte ao vivo</p>
                        <p className="text-sm text-primary">Seg-Sex, 9h-18h</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold mb-1">Endereço</h3>
                        <p className="text-sm text-muted-foreground">
                          São Paulo, SP<br />
                          Brasil
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Form */}
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Envie sua Mensagem</CardTitle>
                    <CardDescription>
                      Preencha o formulário abaixo e retornaremos o mais breve possível.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {success ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
                          <Send className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Mensagem Enviada!</h3>
                        <p className="text-muted-foreground mb-6">
                          Obrigado pelo contato. Responderemos em breve.
                        </p>
                        <Button onClick={() => setSuccess(false)} variant="outline">
                          Enviar Outra Mensagem
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo *</Label>
                            <Input id="name" placeholder="Seu nome" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input id="email" type="email" placeholder="seu@email.com" required />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="subject">Assunto *</Label>
                          <Input id="subject" placeholder="Sobre o que você quer falar?" required />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message">Mensagem *</Label>
                          <Textarea 
                            id="message" 
                            placeholder="Escreva sua mensagem aqui..."
                            rows={6}
                            required
                          />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? (
                            <>Enviando...</>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Enviar Mensagem
                            </>
                          )}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Quick Links */}
        <section className="container pb-20">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-black mb-6">Precisa de Ajuda Rápida?</h2>
            <p className="text-muted-foreground mb-8">
              Confira nossa central de ajuda com as perguntas mais frequentes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/#faq">
                <Button size="lg" variant="outline">
                  Ver FAQ
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="lg" className="bg-gradient-to-r from-primary to-purple-600">
                  Começar Teste Grátis
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} PulseWatch. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
