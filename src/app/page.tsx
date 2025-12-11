import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/navbar'
import { LogoIcon } from '@/components/ui/logo'
import { 
  ShoppingCart, 
  TrendingUp, 
  Zap, 
  Shield, 
  Clock,
  Mail,
  MessageSquare,
  CheckCircle,
  Store,
  ArrowRight,
  Star,
  Users,
  Activity,
  BarChart3,
  ChevronDown,
  Sparkles,
  Globe,
  Lock,
  CreditCard,
  Timer
} from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PulseWatch - Monitoramento Inteligente para E-commerce | Alertas 24/7',
  description: 'Monitore sua loja Shopify, WooCommerce ou Nuvemshop 24/7. Receba alertas instantâneos de quedas de vendas, estoque baixo e problemas críticos. Teste grátis por 7 dias.',
  keywords: ['monitoramento e-commerce', 'alertas shopify', 'woocommerce monitor', 'nuvemshop alertas', 'uptime monitor', 'monitoramento loja virtual'],
  openGraph: {
    title: 'PulseWatch - Nunca Perca Uma Venda Novamente',
    description: 'Monitoramento inteligente 24/7 para sua loja virtual com alertas em tempo real',
    type: 'website',
    url: 'https://pulsewatch.click',
    siteName: 'PulseWatch',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PulseWatch - Monitoramento E-commerce 24/7',
    description: 'Alertas inteligentes para Shopify, WooCommerce e Nuvemshop',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse animation-delay-4000" />
      </div>

      <Navbar />

      <main className="flex-1 pt-24">
        {/* Hero Section */}
        <section className="relative container py-32 md:py-40">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 text-center">
            {/* Badge */}
            <div className="group inline-flex items-center rounded-full border-2 border-primary/20 bg-primary/5 px-6 py-2.5 text-sm font-medium backdrop-blur-sm hover:border-primary/40 transition-all hover:scale-105 cursor-pointer">
              <Zap className="mr-2 h-4 w-4 text-yellow-500 animate-pulse" />
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent font-semibold">
                🔥 Monitoramento em Tempo Real • +500 Lojas Protegidas
              </span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-5xl font-black tracking-tight sm:text-7xl lg:text-8xl leading-tight">
              Nunca Perca Uma
              <span className="block mt-2 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                Venda Novamente
              </span>
            </h1>
            
            {/* Subheading */}
            <p className="max-w-3xl text-xl text-muted-foreground sm:text-2xl leading-relaxed">
              Monitore sua loja <strong className="text-foreground">24 horas por dia</strong> e receba alertas instantâneos sobre 
              <span className="text-destructive font-semibold"> quedas de vendas</span>, 
              <span className="text-orange-600 dark:text-orange-400 font-semibold"> estoque zerado</span> e 
              <span className="text-yellow-600 dark:text-yellow-400 font-semibold"> problemas críticos</span>.
            </p>

            {/* Platform Logos */}
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <span className="text-sm font-medium text-muted-foreground">Compatível com:</span>
              <Badge variant="outline" className="text-sm font-semibold">
                <Store className="h-3.5 w-3.5 mr-1.5" />
                Shopify
              </Badge>
              <Badge variant="outline" className="text-sm font-semibold">
                <Store className="h-3.5 w-3.5 mr-1.5" />
                WooCommerce
              </Badge>
              <Badge variant="outline" className="text-sm font-semibold">
                <Store className="h-3.5 w-3.5 mr-1.5" />
                Nuvemshop
              </Badge>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg mt-4">
              <Link href="/auth/signup" className="flex-1 group">
                <Button size="lg" className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-2xl hover:shadow-primary/50 transition-all group-hover:scale-105">
                  <Sparkles className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Começar Teste Grátis
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#how-it-works" className="flex-1 group">
                <Button size="lg" variant="outline" className="w-full h-14 text-lg font-semibold border-2 hover:bg-primary/5 transition-all group-hover:scale-105">
                  Ver Como Funciona
                </Button>
              </Link>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm mt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">✅ Grátis por 7 dias</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">💳 Sem cartão</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">⚡ Setup em 2min</span>
              </div>
            </div>

            {/* Social Proof */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-muted/50 backdrop-blur-sm border">
              <div className="flex -space-x-4">
                <div className="w-12 h-12 rounded-full border-2 border-background bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">JS</div>
                <div className="w-12 h-12 rounded-full border-2 border-background bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold">ML</div>
                <div className="w-12 h-12 rounded-full border-2 border-background bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold">AR</div>
                <div className="w-12 h-12 rounded-full border-2 border-background bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">+500</div>
              </div>
              <div className="text-center sm:text-left">
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="ml-2 font-bold text-sm">4.9/5</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">500+ lojistas</strong> já protegem suas vendas com PulseWatch
                </p>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="h-6 w-6 text-muted-foreground" />
          </div>
        </section>

        {/* Stats Section */}
        <section className="container py-16 border-y bg-muted/30">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Activity className="h-8 w-8 text-primary" />
                  <p className="text-4xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">99.9%</p>
                </div>
                <p className="text-sm font-medium text-muted-foreground">Uptime Garantido</p>
              </div>
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Users className="h-8 w-8 text-primary" />
                  <p className="text-4xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">500+</p>
                </div>
                <p className="text-sm font-medium text-muted-foreground">Lojas Monitoradas</p>
              </div>
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Timer className="h-8 w-8 text-primary" />
                  <p className="text-4xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">5min</p>
                </div>
                <p className="text-sm font-medium text-muted-foreground">Verificação Premium</p>
              </div>
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <BarChart3 className="h-8 w-8 text-primary" />
                  <p className="text-4xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">2M+</p>
                </div>
                <p className="text-sm font-medium text-muted-foreground">Alertas Enviados</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container py-24">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-20">
              <Badge className="mb-4" variant="outline">
                <Sparkles className="h-3 w-3 mr-1" />
                Recursos Premium
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                Tudo que Você Precisa Para
                <span className="block bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Proteger Suas Vendas
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Ferramentas profissionais que trabalham 24/7 para manter sua loja online e vendendo
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="group hover:shadow-2xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-2">
                <CardHeader>
                  <div className="mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Store className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl">Detecção Automática</CardTitle>
                  <CardDescription className="text-base">
                    Identifica automaticamente Shopify, WooCommerce ou Nuvemshop sem configuração manual
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="group hover:shadow-2xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-2">
                <CardHeader>
                  <div className="mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Clock className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl">Verificação a Cada 5min</CardTitle>
                  <CardDescription className="text-base">
                    Monitoramento contínuo ultra-rápido do status da sua loja e produtos em tempo real
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="group hover:shadow-2xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-2">
                <CardHeader>
                  <div className="mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mail className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl">Alertas via Email</CardTitle>
                  <CardDescription className="text-base">
                    Receba notificações instantâneas e detalhadas direto no seu email com análise completa
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="group hover:shadow-2xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-2">
                <CardHeader>
                  <div className="mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageSquare className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl">Alertas via Telegram</CardTitle>
                  <CardDescription className="text-base">
                    Conecte seu Telegram e receba alertas em tempo real onde você estiver
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="group hover:shadow-2xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-2">
                <CardHeader>
                  <div className="mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShoppingCart className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl">Controle de Estoque</CardTitle>
                  <CardDescription className="text-base">
                    Alertas inteligentes de produtos esgotados, estoque baixo e reabastecimento
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="group hover:shadow-2xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-2">
                <CardHeader>
                  <div className="mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl">Seguro e Confiável</CardTitle>
                  <CardDescription className="text-base">
                    Seus dados protegidos com criptografia de ponta e infraestrutura enterprise-grade
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Platform CTA Section */}
        <section id="platforms" className="container py-24 bg-gradient-to-b from-muted/50 to-background">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-20">
              <Badge className="mb-4" variant="outline">
                <Globe className="h-3 w-3 mr-1" />
                Plataformas Suportadas
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                Monitoramento Especializado
                <span className="block bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Para Cada Plataforma
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Integração nativa e otimizada para as principais plataformas de e-commerce do Brasil
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {/* Shopify */}
              <Link href="/monitoramento-shopify" className="group">
                <Card className="h-full transition-all duration-500 hover:shadow-2xl hover:border-[#96bf48] group-hover:-translate-y-3 bg-gradient-to-br from-background to-[#96bf48]/5">
                  <CardHeader className="text-center space-y-4">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#96bf48] to-[#7a9f3a] shadow-xl group-hover:scale-110 transition-transform duration-300">
                      <svg className="h-10 w-10" viewBox="0 0 24 24" fill="white">
                        <path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-.905-.895-1.006-.997l-.003.001v.001c-.101-.101-.301-.07-.401-.04-.002 0-.166.051-.423.139-.252-.735-.696-1.413-1.481-1.413-.043 0-.088.003-.133.006-.221-.29-.494-.419-.723-.419-1.781 0-2.632 2.226-2.898 3.358-.69.213-1.181.365-1.242.384-.388.122-.4.134-.451.501-.039.275-1.058 8.134-1.058 8.134l7.859 1.473.509-.009zM14.4 5.938l-.002.001v.001c-.001.001-.001.001-.001.001v.001c-.161.05-.338.104-.527.163.003-.116.003-.236.003-.361 0-.108-.003-.227-.006-.35.177.15.354.329.533.544zm-.934-1.2c.009.153.013.322.013.513v.104c-.346.107-.723.224-1.102.341.213-.817.612-1.217.994-1.368.038.124.069.26.095.41zm-.478-1.032c.064 0 .129.021.192.063-.594.279-1.23 1.016-1.498 2.469-.304.094-.601.186-.876.271.245-.988.829-2.803 2.182-2.803z"/>
                      </svg>
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-2">Shopify</CardTitle>
                      <Badge className="mb-3" variant="secondary">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Mais Popular
                      </Badge>
                    </div>
                    <CardDescription className="text-base leading-relaxed">
                      <strong>Detecte automaticamente:</strong> Erros de checkout, quedas de vendas, problemas de estoque e falhas de integração
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center pb-6">
                    <Button className="w-full group-hover:bg-[#96bf48] group-hover:text-white transition-all shadow-lg" variant="outline">
                      Ver Monitoramento Shopify
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              {/* WooCommerce */}
              <Link href="/monitoramento-woocommerce" className="group">
                <Card className="h-full transition-all duration-500 hover:shadow-2xl hover:border-[#9b5c8f] group-hover:-translate-y-3 bg-gradient-to-br from-background to-[#9b5c8f]/5">
                  <CardHeader className="text-center space-y-4">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#9b5c8f] to-[#7a4a6f] shadow-xl group-hover:scale-110 transition-transform duration-300">
                      <svg className="h-10 w-10" viewBox="0 0 24 24" fill="white">
                        <path d="M2.227 4.857A2.228 2.228 0 000 7.094v7.457c0 1.236 1.001 2.237 2.237 2.237h4.465l-1.115 3.36 4.46-3.36h11.718A2.228 2.228 0 0024 14.551V7.094a2.228 2.228 0 00-2.235-2.237H2.227z"/>
                      </svg>
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-2">WooCommerce</CardTitle>
                      <Badge className="mb-3" variant="secondary">
                        <Shield className="h-3 w-3 mr-1" />
                        WordPress
                      </Badge>
                    </div>
                    <CardDescription className="text-base leading-relaxed">
                      <strong>Monitore em tempo real:</strong> Conflitos de plugins, falhas de pagamento, performance e segurança da loja
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center pb-6">
                    <Button className="w-full group-hover:bg-[#9b5c8f] group-hover:text-white transition-all shadow-lg" variant="outline">
                      Ver Monitoramento WooCommerce
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              {/* Nuvemshop */}
              <Link href="/monitoramento-nuvemshop" className="group">
                <Card className="h-full transition-all duration-500 hover:shadow-2xl hover:border-[#2C68F6] group-hover:-translate-y-3 bg-gradient-to-br from-background to-[#2C68F6]/5">
                  <CardHeader className="text-center space-y-4">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#2C68F6] to-[#1a4fd6] shadow-xl group-hover:scale-110 transition-transform duration-300">
                      <svg className="h-10 w-10" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                      </svg>
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-2">Nuvemshop</CardTitle>
                      <Badge className="mb-3" variant="secondary">
                        <Globe className="h-3 w-3 mr-1" />
                        América Latina
                      </Badge>
                    </div>
                    <CardDescription className="text-base leading-relaxed">
                      <strong>Alertas inteligentes:</strong> Problemas críticos que podem impactar suas vendas e experiência do cliente
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center pb-6">
                    <Button className="w-full group-hover:bg-[#2C68F6] group-hover:text-white transition-all shadow-lg" variant="outline">
                      Ver Monitoramento Nuvemshop
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="container py-24">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-20">
              <Badge className="mb-4" variant="outline">
                <Zap className="h-3 w-3 mr-1" />
                Simples e Rápido
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                Configure em
                <span className="block bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Menos de 2 Minutos
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Processo simplificado para você começar a proteger suas vendas imediatamente
              </p>
            </div>

            <div className="relative">
              {/* Connection Line */}
              <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-full" />
              
              <div className="grid gap-12 md:grid-cols-3 relative">
                <div className="flex flex-col items-center text-center group">
                  <div className="mb-6 relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 text-3xl font-black text-white shadow-2xl group-hover:scale-110 transition-all duration-300">
                      1
                    </div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl blur-lg opacity-30 group-hover:opacity-60 transition-opacity" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold">Cadastre-se Grátis</h3>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    Crie sua conta em <strong className="text-foreground">30 segundos</strong>. Sem cartão de crédito, sem pegadinhas.
                  </p>
                  <CheckCircle className="h-8 w-8 text-green-500 mt-4" />
                </div>

                <div className="flex flex-col items-center text-center group">
                  <div className="mb-6 relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-500 to-purple-600 text-3xl font-black text-white shadow-2xl group-hover:scale-110 transition-all duration-300">
                      2
                    </div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-3xl blur-lg opacity-30 group-hover:opacity-60 transition-opacity" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold">Conecte sua Loja</h3>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    Digite o domínio e pronto! <strong className="text-foreground">Detectamos automaticamente</strong> sua plataforma.
                  </p>
                  <CheckCircle className="h-8 w-8 text-green-500 mt-4" />
                </div>

                <div className="flex flex-col items-center text-center group">
                  <div className="mb-6 relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-pink-500 to-pink-600 text-3xl font-black text-white shadow-2xl group-hover:scale-110 transition-all duration-300">
                      3
                    </div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-pink-600 rounded-3xl blur-lg opacity-30 group-hover:opacity-60 transition-opacity" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold">Receba Alertas</h3>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    Pronto! <strong className="text-foreground">Monitoramento ativo 24/7</strong> com alertas em tempo real.
                  </p>
                  <CheckCircle className="h-8 w-8 text-green-500 mt-4" />
                </div>
              </div>
            </div>

            {/* CTA After How It Works */}
            <div className="mt-16 text-center">
              <Link href="/auth/signup">
                <Button size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-2xl hover:shadow-primary/50 transition-all group">
                  <Sparkles className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Começar Agora - É Grátis
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <p className="mt-4 text-sm text-muted-foreground">
                ✨ Sem cartão • Sem compromisso • Cancele quando quiser
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="container py-24 bg-gradient-to-b from-muted/50 via-muted/30 to-background">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-20">
              <Badge className="mb-4" variant="outline">
                <CreditCard className="h-3 w-3 mr-1" />
                Preços Transparentes
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                Planos Que Cabem
                <span className="block bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  No Seu Bolso
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
                Começe gratuitamente e escale conforme seu negócio cresce
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-full backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  🎉 Todos os planos incluem 7 dias de teste grátis - sem cartão!
                </span>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
              {/* Free Plan */}
              <Card className="relative group hover:shadow-2xl transition-all duration-300 border-2">
                <CardHeader className="pb-8">
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-3xl font-black">Teste Gratuito</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      <Timer className="h-3 w-3 mr-1" />
                      7 Dias
                    </Badge>
                  </div>
                  <CardDescription className="text-base">
                    Experimente todas as funcionalidades essenciais sem compromisso
                  </CardDescription>
                  <div className="mt-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">R$ 0</span>
                      <span className="text-lg text-muted-foreground font-medium">/7 dias</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-green-500" />
                      <strong className="text-foreground">100% gratuito</strong> - Sem cartão, sem pegadinhas
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gradient-to-br from-muted to-muted/50 rounded-xl p-4 border">
                    <p className="text-sm font-medium mb-1">🎯 Ideal para:</p>
                    <p className="text-xs text-muted-foreground">
                      Conhecer o PulseWatch e validar se a ferramenta atende suas necessidades antes de investir
                    </p>
                  </div>

                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <span className="font-semibold text-base">1 loja monitorada</span>
                        <p className="text-sm text-muted-foreground">Perfeito para começar e testar</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <span className="font-semibold text-base">Verificação a cada 10min</span>
                        <p className="text-sm text-muted-foreground">Monitoramento contínuo 24/7</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <span className="font-semibold text-base">Alertas via email</span>
                        <p className="text-sm text-muted-foreground">Notificações instantâneas e detalhadas</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <span className="font-semibold text-base">Controle de estoque</span>
                        <p className="text-sm text-muted-foreground">Alertas de produtos zerados</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <span className="font-semibold text-base">Dashboard intuitivo</span>
                        <p className="text-sm text-muted-foreground">Visão completa da sua loja</p>
                      </div>
                    </li>
                  </ul>

                  <div className="pt-6 border-t space-y-3">
                    <Link href="/auth/signup" className="w-full block">
                      <Button variant="outline" className="w-full h-12 text-base font-semibold group-hover:bg-primary/5 border-2" size="lg">
                        Começar Teste Grátis
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                    <p className="text-xs text-center text-muted-foreground">
                      ✅ Sem instalação • 🚀 Setup em 2min
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Premium Plan */}
              <Card className="relative group hover:shadow-2xl transition-all duration-300 border-2 border-primary bg-gradient-to-br from-primary/5 via-background to-purple-500/5">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white px-6 py-2 text-sm font-bold shadow-xl">
                    <Star className="h-4 w-4 mr-1 fill-white" />
                    MAIS POPULAR
                  </Badge>
                </div>
                <CardHeader className="pb-8 pt-8">
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-3xl font-black">Premium</CardTitle>
                    <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Melhor Custo-Benefício
                    </Badge>
                  </div>
                  <CardDescription className="text-base">
                    Para lojistas sérios que querem maximizar suas vendas e minimizar riscos
                  </CardDescription>
                  <div className="mt-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">R$ 29,99</span>
                      <div className="flex flex-col">
                        <span className="text-lg text-muted-foreground font-medium">/mês</span>
                        <span className="text-xs text-muted-foreground">~ R$ 1/dia</span>
                      </div>
                    </div>
                    <p className="text-sm mt-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <strong className="text-foreground">Cancele quando quiser</strong> - Sem multas, sem complicação
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-2 border-primary/20 rounded-xl p-4">
                    <p className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      O que torna o Premium especial:
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Monitore <strong>todas as suas lojas</strong>, receba alertas <strong>2x mais rápidos</strong> e tenha controle total com analytics avançado
                    </p>
                  </div>
                  
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="font-semibold text-base">Lojas ilimitadas</span>
                        <p className="text-sm text-muted-foreground">Monitore quantas lojas quiser sem custo adicional</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="font-semibold text-base">Verificação a cada 5min</span>
                        <p className="text-sm text-muted-foreground">Alertas 2x mais rápidos = menos vendas perdidas</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="font-semibold text-base">Email + Telegram + SMS</span>
                        <p className="text-sm text-muted-foreground">Múltiplos canais de notificação em tempo real</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="font-semibold text-base">Histórico ilimitado</span>
                        <p className="text-sm text-muted-foreground">Análise completa de todos os eventos</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="font-semibold text-base">Dashboard Pro com IA</span>
                        <p className="text-sm text-muted-foreground">Insights inteligentes e previsões de vendas</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="font-semibold text-base">Suporte VIP 24/7</span>
                        <p className="text-sm text-muted-foreground">Atendimento prioritário em até 2h</p>
                      </div>
                    </li>
                  </ul>

                  <div className="pt-6 border-t space-y-3">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-center">
                      <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">
                        🎉 Oferta Especial: Primeiro mês com 20% OFF!
                      </p>
                    </div>
                    <Link href="/auth/signup" className="w-full block">
                      <Button className="w-full h-12 text-base font-bold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-xl hover:shadow-2xl transition-all group-hover:scale-105" size="lg">
                        <Sparkles className="h-5 w-5 mr-2" />
                        Ativar Premium Agora
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    </Link>
                    <p className="text-xs text-center text-muted-foreground">
                      ✨ 7 dias grátis • 🚫 Sem fidelidade • ✅ Cancele a qualquer momento
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-8">
              💳 Pagamento seguro via Stripe • ❌ Cancele quando quiser • 🔒 Dados protegidos
            </p>

            {/* Trial Info */}
            <div className="mt-12 max-w-3xl mx-auto">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold mb-2">
                      🎁 Como funciona o teste grátis de 7 dias?
                    </h3>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-2xl">1️⃣</span>
                      </div>
                      <p className="font-medium mb-1">Cadastre-se grátis</p>
                      <p className="text-xs text-muted-foreground">
                        Sem precisar de cartão de crédito
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-2xl">2️⃣</span>
                      </div>
                      <p className="font-medium mb-1">Use por 7 dias</p>
                      <p className="text-xs text-muted-foreground">
                        Acesso total a todas as funcionalidades
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-2xl">3️⃣</span>
                      </div>
                      <p className="font-medium mb-1">Decida se vale a pena</p>
                      <p className="text-xs text-muted-foreground">
                        Escolha seu plano ou cancele sem custo
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-background/50 rounded-lg">
                    <p className="text-xs text-center text-muted-foreground">
                      ✨ <strong>Garantia:</strong> Após os 7 dias, você escolhe se quer continuar com o plano Free ou fazer upgrade para o Premium. Sem cobranças surpresa!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="container py-24">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-16">
              <Badge className="mb-4" variant="outline">
                <MessageSquare className="h-3 w-3 mr-1" />
                Perguntas Frequentes
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                Dúvidas?
                <span className="block bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Temos as Respostas
                </span>
              </h2>
              <p className="text-xl text-muted-foreground">
                Tudo que você precisa saber sobre o PulseWatch
              </p>
            </div>

            <div className="space-y-4">
              <details className="group rounded-2xl border-2 border-muted hover:border-primary/50 transition-all bg-card p-6">
                <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-lg">
                  <span>🚀 Como funciona o período de teste gratuito?</span>
                  <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-4 text-muted-foreground leading-relaxed">
                  <p>Você tem acesso <strong>completo e ilimitado</strong> a todas as funcionalidades por 7 dias, sem precisar cadastrar cartão de crédito. Após o período, escolha se quer continuar no plano gratuito (1 loja) ou fazer upgrade para o Premium.</p>
                </div>
              </details>

              <details className="group rounded-2xl border-2 border-muted hover:border-primary/50 transition-all bg-card p-6">
                <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-lg">
                  <span>💳 Preciso cadastrar cartão de crédito para testar?</span>
                  <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-4 text-muted-foreground leading-relaxed">
                  <p><strong>Não!</strong> O teste de 7 dias é 100% gratuito e não exige nenhum dado de pagamento. Você só precisa cadastrar um email válido e pronto!</p>
                </div>
              </details>

              <details className="group rounded-2xl border-2 border-muted hover:border-primary/50 transition-all bg-card p-6">
                <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-lg">
                  <span>⚡ Quanto tempo leva para configurar?</span>
                  <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-4 text-muted-foreground leading-relaxed">
                  <p>Menos de <strong>2 minutos</strong>! Basta cadastrar sua conta, adicionar o domínio da sua loja e o PulseWatch detecta automaticamente a plataforma (Shopify, WooCommerce ou Nuvemshop). Não precisa instalar plugins ou fazer integrações complexas.</p>
                </div>
              </details>

              <details className="group rounded-2xl border-2 border-muted hover:border-primary/50 transition-all bg-card p-6">
                <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-lg">
                  <span>🔔 Que tipos de alertas eu recebo?</span>
                  <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-4 text-muted-foreground leading-relaxed">
                  <p>Você recebe alertas sobre:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><strong>Loja offline</strong> - Site fora do ar</li>
                    <li><strong>Estoque zerado</strong> - Produtos sem estoque</li>
                    <li><strong>Estoque baixo</strong> - Produtos com estoque crítico</li>
                    <li><strong>Produtos voltando</strong> - Reabastecimento</li>
                    <li><strong>Erros críticos</strong> - Problemas que afetam vendas</li>
                  </ul>
                </div>
              </details>

              <details className="group rounded-2xl border-2 border-muted hover:border-primary/50 transition-all bg-card p-6">
                <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-lg">
                  <span>📱 Como recebo os alertas?</span>
                  <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-4 text-muted-foreground leading-relaxed">
                  <p>No plano gratuito, você recebe alertas por <strong>email</strong>. No plano Premium, além do email, você pode configurar alertas via <strong>Telegram</strong> e <strong>SMS</strong> para ser notificado instantaneamente onde você estiver!</p>
                </div>
              </details>

              <details className="group rounded-2xl border-2 border-muted hover:border-primary/50 transition-all bg-card p-6">
                <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-lg">
                  <span>🏪 Posso monitorar mais de uma loja?</span>
                  <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-4 text-muted-foreground leading-relaxed">
                  <p>Sim! O plano gratuito permite monitorar 1 loja. Com o <strong>Premium</strong>, você pode adicionar <strong>quantas lojas quiser</strong> sem custo adicional, perfeito para quem tem múltiplos e-commerces.</p>
                </div>
              </details>

              <details className="group rounded-2xl border-2 border-muted hover:border-primary/50 transition-all bg-card p-6">
                <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-lg">
                  <span>❌ Posso cancelar a qualquer momento?</span>
                  <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-4 text-muted-foreground leading-relaxed">
                  <p><strong>Sim, sem multas ou burocracia!</strong> Você pode cancelar seu plano Premium a qualquer momento com apenas 1 clique. Não há período de fidelidade ou taxas de cancelamento.</p>
                </div>
              </details>

              <details className="group rounded-2xl border-2 border-muted hover:border-primary/50 transition-all bg-card p-6">
                <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-lg">
                  <span>🔒 Meus dados estão seguros?</span>
                  <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-4 text-muted-foreground leading-relaxed">
                  <p>Absolutamente! Usamos <strong>criptografia de ponta a ponta</strong>, infraestrutura enterprise-grade e seguimos todas as melhores práticas de segurança. Seus dados nunca são compartilhados com terceiros.</p>
                </div>
              </details>
            </div>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-4">Ainda tem dúvidas?</p>
              <Link href="/contact">
                <Button variant="outline" size="lg">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Falar com Suporte
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative container py-32 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 rounded-3xl" />
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
          
          <div className="relative mx-auto max-w-4xl text-center">
            <Badge className="mb-6" variant="secondary">
              <Sparkles className="h-3 w-3 mr-1" />
              Comece Agora
            </Badge>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
              Proteja Suas Vendas
              <span className="block mt-2 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Começando Hoje
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
              Junte-se a <strong className="text-foreground">500+ lojistas</strong> que já protegem suas vendas 24/7 com alertas inteligentes
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto mb-8">
              <Link href="/auth/signup" className="flex-1">
                <Button size="lg" className="w-full h-16 text-lg font-bold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-2xl hover:shadow-primary/50 transition-all group">
                  <Sparkles className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                  Começar Teste Grátis Agora
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">✅ 7 dias grátis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">💳 Sem cartão</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">⚡ Setup em 2min</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">❌ Cancele quando quiser</span>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex items-center justify-center gap-8 flex-wrap opacity-60">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span className="text-sm font-medium">SSL Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                <span className="text-sm font-medium">LGPD Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <span className="text-sm font-medium">Pagamento via Stripe</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container py-16">
          <div className="grid gap-12 md:grid-cols-12">
            {/* Brand Column */}
            <div className="md:col-span-4">
              <Link href="/" className="flex items-center gap-2 mb-4 group">
                <div className="relative">
                  <LogoIcon className="h-16 w-16 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">PulseWatch</span>
              </Link>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Monitoramento inteligente 24/7 para e-commerce. Proteja suas vendas com alertas em tempo real.
              </p>
              <div className="flex items-center gap-4">
                <a href="https://twitter.com/pulsewatch" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="https://linkedin.com/company/pulsewatch" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a href="https://github.com/pulsewatch" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Links Columns */}
            <div className="md:col-span-2">
              <h4 className="font-bold mb-4 text-foreground">Produto</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="text-muted-foreground hover:text-primary transition-colors">Recursos</a></li>
                <li><a href="#platforms" className="text-muted-foreground hover:text-primary transition-colors">Plataformas</a></li>
                <li><a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">Preços</a></li>
                <li><a href="#faq" className="text-muted-foreground hover:text-primary transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div className="md:col-span-2">
              <h4 className="font-bold mb-4 text-foreground">Plataformas</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/monitoramento-shopify" className="text-muted-foreground hover:text-primary transition-colors">Shopify</Link></li>
                <li><Link href="/monitoramento-woocommerce" className="text-muted-foreground hover:text-primary transition-colors">WooCommerce</Link></li>
                <li><Link href="/monitoramento-nuvemshop" className="text-muted-foreground hover:text-primary transition-colors">Nuvemshop</Link></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="font-bold mb-4 text-foreground">Empresa</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
                <li><a href="/about" className="text-muted-foreground hover:text-primary transition-colors">Sobre Nós</a></li>
                <li><a href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contato</a></li>
                <li><a href="/careers" className="text-muted-foreground hover:text-primary transition-colors">Carreiras</a></li>
              </ul>
            </div>
            
            <div className="md:col-span-2">
              <h4 className="font-bold mb-4 text-foreground">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacidade</a></li>
                <li><a href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Termos de Uso</a></li>
                <li><a href="/cookies" className="text-muted-foreground hover:text-primary transition-colors">Política de Cookies</a></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground text-center md:text-left">
                © {new Date().getFullYear()} PulseWatch. Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  SSL Seguro
                </span>
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  LGPD Compliant
                </span>
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-green-500" />
                  Status: Online
                </span>
              </div>
            </div>
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
