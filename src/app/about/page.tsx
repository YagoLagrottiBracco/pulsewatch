import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/navbar'
import { Users, Target, Zap, Heart, TrendingUp, Shield } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sobre Nós - PulseWatch | Nossa História e Missão',
  description: 'Conheça a história do PulseWatch e nossa missão de proteger e-commerces 24/7. Saiba mais sobre nossa equipe e valores.',
  openGraph: {
    title: 'Sobre Nós - PulseWatch',
    description: 'Conheça a história do PulseWatch e nossa missão de proteger e-commerces 24/7.',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 pt-24">
        {/* Hero Section */}
        <section className="container py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-6" variant="outline">
              <Heart className="h-3 w-3 mr-1" />
              Sobre Nós
            </Badge>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
              Protegendo o Futuro do
              <span className="block bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                E-commerce Brasileiro
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Fundada em 2024, a PulseWatch nasceu da frustração de ver lojistas perderem vendas por problemas que poderiam ter sido evitados com um simples alerta.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="container py-16 border-y bg-muted/30">
          <div className="mx-auto max-w-6xl">
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardContent className="pt-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Nossa Missão</h3>
                  <p className="text-muted-foreground">
                    Garantir que nenhum lojista perca vendas por falta de visibilidade sobre problemas em sua loja online.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Nossa Visão</h3>
                  <p className="text-muted-foreground">
                    Ser a plataforma líder de monitoramento para e-commerce na América Latina até 2026.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Nossos Valores</h3>
                  <p className="text-muted-foreground">
                    Transparência, inovação e obsessão pelo sucesso dos nossos clientes.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="container py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-4xl font-black mb-8 text-center">
              Nossa História
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                Tudo começou quando um dos nossos fundadores perdeu milhares de reais em vendas porque sua loja Shopify ficou fora do ar durante um fim de semana inteiro - e ele só descobriu na segunda-feira, ao checar o faturamento.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                Naquele momento, percebemos que havia uma lacuna enorme no mercado: lojistas precisavam de uma forma simples, confiável e automática de monitorar suas lojas 24/7.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                Assim nasceu o PulseWatch. Começamos com um script básico de monitoramento e hoje somos uma plataforma completa, protegendo mais de 500 lojas em todo o Brasil.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container py-16 border-y bg-muted/30">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-8 w-8 text-primary" />
                  <p className="text-4xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">500+</p>
                </div>
                <p className="text-sm font-medium text-muted-foreground">Lojas Monitoradas</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Shield className="h-8 w-8 text-primary" />
                  <p className="text-4xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">99.9%</p>
                </div>
                <p className="text-sm font-medium text-muted-foreground">Uptime Garantido</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="h-8 w-8 text-primary" />
                  <p className="text-4xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">2M+</p>
                </div>
                <p className="text-sm font-medium text-muted-foreground">Alertas Enviados</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-8 w-8 text-primary" />
                  <p className="text-4xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">R$10M+</p>
                </div>
                <p className="text-sm font-medium text-muted-foreground">Vendas Protegidas</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Faça Parte da Nossa História
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Junte-se a centenas de lojistas que já confiam no PulseWatch para proteger suas vendas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-xl">
                  Começar Teste Grátis
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline">
                  Fale Conosco
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
