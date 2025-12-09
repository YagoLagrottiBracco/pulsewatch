import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Bell, 
  ShoppingCart, 
  TrendingUp, 
  Zap, 
  Shield, 
  Clock,
  Mail,
  MessageSquare,
  CheckCircle,
  Store
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">PulseWatch</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Recursos
            </a>
            <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
              Como Funciona
            </a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Preços
            </a>
            <Link href="/blog" className="text-sm font-medium hover:text-primary transition-colors">
              Blog
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Começar Grátis</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container py-24 md:py-32">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 text-center">
            <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm">
              <Zap className="mr-2 h-4 w-4 text-yellow-500" />
              <span>Monitoramento em Tempo Real</span>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Monitore Seu E-commerce
              <span className="block text-primary">24 Horas por Dia</span>
            </h1>
            
            <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Receba alertas instantâneos sobre quedas de vendas, produtos esgotados e problemas na sua loja. 
              Compatível com <strong>Shopify</strong>, <strong>WooCommerce</strong> e <strong>Nuvemshop</strong>.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <Link href="/auth/signup" className="flex-1">
                <Button size="lg" className="w-full">
                  Começar Gratuitamente
                </Button>
              </Link>
              <Link href="#how-it-works" className="flex-1">
                <Button size="lg" variant="outline" className="w-full">
                  Ver Demonstração
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Configuração em 2 minutos</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container py-24 bg-muted/50">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Recursos Poderosos
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Tudo que você precisa para manter seu e-commerce funcionando perfeitamente
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <Store className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Detecção Automática</CardTitle>
                  <CardDescription>
                    Identifica automaticamente Shopify, WooCommerce ou Nuvemshop
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Clock className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Verificação a Cada 10min</CardTitle>
                  <CardDescription>
                    Monitoramento contínuo do status da sua loja e produtos
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Mail className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Alertas via Email</CardTitle>
                  <CardDescription>
                    Receba notificações instantâneas no seu email
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <MessageSquare className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Alertas via Telegram</CardTitle>
                  <CardDescription>
                    Conecte seu Telegram e receba alertas em tempo real
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <ShoppingCart className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Controle de Estoque</CardTitle>
                  <CardDescription>
                    Alertas de produtos esgotados ou com estoque baixo
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Seguro e Confiável</CardTitle>
                  <CardDescription>
                    Seus dados protegidos com criptografia de ponta
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="container py-24">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Como Funciona
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Configure em minutos e comece a monitorar
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  1
                </div>
                <h3 className="mb-2 text-xl font-semibold">Cadastre-se</h3>
                <p className="text-muted-foreground">
                  Crie sua conta gratuitamente em segundos
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  2
                </div>
                <h3 className="mb-2 text-xl font-semibold">Adicione sua Loja</h3>
                <p className="text-muted-foreground">
                  Informe o domínio - detectamos a plataforma automaticamente
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  3
                </div>
                <h3 className="mb-2 text-xl font-semibold">Receba Alertas</h3>
                <p className="text-muted-foreground">
                  Seja notificado instantaneamente sobre qualquer problema
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container py-24 bg-primary text-primary-foreground">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Pronto para Começar?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Junte-se a centenas de lojistas que confiam no PulseWatch
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Input 
                type="email" 
                placeholder="seu@email.com" 
                className="bg-background text-foreground"
              />
              <Button size="lg" variant="secondary">
                Começar Grátis
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-primary" />
                <span className="font-bold">PulseWatch</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Monitoramento inteligente para seu e-commerce
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Recursos</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Preços</a></li>
                <li><a href="/docs" className="hover:text-foreground">Documentação</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/about" className="hover:text-foreground">Sobre</a></li>
                <li><a href="/blog" className="hover:text-foreground">Blog</a></li>
                <li><a href="/contact" className="hover:text-foreground">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/privacy" className="hover:text-foreground">Privacidade</a></li>
                <li><a href="/terms" className="hover:text-foreground">Termos</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} PulseWatch. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'PulseWatch',
            applicationCategory: 'BusinessApplication',
            description: 'Monitoramento inteligente de e-commerce com alertas automáticos',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'BRL',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              ratingCount: '127',
            },
          }),
        }}
      />
    </div>
  )
}
