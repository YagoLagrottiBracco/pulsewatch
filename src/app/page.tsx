import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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

        {/* Platform CTA Section */}
        <section className="container py-24">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Monitoramento Especializado por Plataforma
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Escolha sua plataforma e descubra como o PulseWatch pode proteger suas vendas
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Shopify */}
              <Link href="/monitoramento-shopify" className="group">
                <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 group-hover:-translate-y-1">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#96bf48]/10">
                      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="#96bf48">
                        <path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-.905-.895-1.006-.997l-.003.001v.001c-.101-.101-.301-.07-.401-.04-.002 0-.166.051-.423.139-.252-.735-.696-1.413-1.481-1.413-.043 0-.088.003-.133.006-.221-.29-.494-.419-.723-.419-1.781 0-2.632 2.226-2.898 3.358-.69.213-1.181.365-1.242.384-.388.122-.4.134-.451.501-.039.275-1.058 8.134-1.058 8.134l7.859 1.473.509-.009zM14.4 5.938l-.002.001v.001c-.001.001-.001.001-.001.001v.001c-.161.05-.338.104-.527.163.003-.116.003-.236.003-.361 0-.108-.003-.227-.006-.35.177.15.354.329.533.544zm-.934-1.2c.009.153.013.322.013.513v.104c-.346.107-.723.224-1.102.341.213-.817.612-1.217.994-1.368.038.124.069.26.095.41zm-.478-1.032c.064 0 .129.021.192.063-.594.279-1.23 1.016-1.498 2.469-.304.094-.601.186-.876.271.245-.988.829-2.803 2.182-2.803z"/>
                      </svg>
                    </div>
                    <CardTitle className="text-xl">Shopify</CardTitle>
                    <CardDescription>
                      Detecte erros de checkout, quedas de vendas e problemas de estoque automaticamente
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Ver Monitoramento Shopify
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              {/* WooCommerce */}
              <Link href="/monitoramento-woocommerce" className="group">
                <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 group-hover:-translate-y-1">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#9b5c8f]/10">
                      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="#9b5c8f">
                        <path d="M2.227 4.857A2.228 2.228 0 000 7.094v7.457c0 1.236 1.001 2.237 2.237 2.237h4.465l-1.115 3.36 4.46-3.36h11.718A2.228 2.228 0 0024 14.551V7.094a2.228 2.228 0 00-2.235-2.237H2.227zM5.4 8.063c.141-.017.293.013.435.11.236.162.354.444.354.85v.002c0 .198-.039.478-.122.833l-.855 3.14c-.07.288-.159.505-.274.653-.115.148-.258.222-.431.222-.172 0-.313-.07-.421-.214-.107-.142-.161-.323-.161-.54 0-.06.006-.137.016-.23l.234-1.63-.666 1.925c-.068.197-.158.349-.271.455-.112.107-.241.16-.388.16-.145 0-.267-.051-.364-.154-.098-.103-.164-.245-.2-.426l-.421-2.237-.328 1.878c-.051.36-.077.609-.077.747 0 .179.037.313.11.4.072.09.183.133.334.133.052 0 .125-.009.22-.028l-.055.347c-.146.043-.275.064-.386.064-.247 0-.434-.074-.562-.222-.128-.148-.192-.358-.192-.63 0-.163.027-.391.082-.683l.518-2.895c.053-.29.137-.504.251-.642.115-.138.268-.207.461-.207.186 0 .331.057.435.173.104.115.177.295.218.54l.365 2.003.674-2.003c.07-.21.161-.37.273-.477.112-.109.241-.163.388-.163zm4.472.001c.447 0 .822.181 1.122.543.301.362.451.85.451 1.464 0 .725-.186 1.325-.558 1.8-.371.476-.834.714-1.388.714-.448 0-.823-.181-1.123-.544-.3-.362-.45-.85-.45-1.463 0-.726.185-1.326.556-1.8.372-.476.836-.714 1.39-.714zm8.123 0c.447 0 .821.181 1.122.543.3.362.45.85.45 1.464 0 .725-.185 1.325-.557 1.8-.371.476-.834.714-1.388.714-.447 0-.822-.181-1.122-.544-.3-.362-.451-.85-.451-1.463 0-.726.186-1.326.557-1.8.372-.476.836-.714 1.39-.714zm-8.093.615c-.258 0-.474.138-.65.414-.175.277-.262.64-.262 1.09 0 .352.062.632.188.841.125.21.288.315.488.315.258 0 .475-.138.65-.415.175-.276.263-.64.263-1.089 0-.352-.063-.633-.188-.841-.125-.21-.288-.315-.489-.315zm8.122 0c-.258 0-.475.138-.65.414-.175.277-.262.64-.262 1.09 0 .352.063.632.188.841.125.21.288.315.489.315.257 0 .474-.138.65-.415.175-.276.262-.64.262-1.089 0-.352-.063-.633-.188-.841-.125-.21-.288-.315-.489-.315zm-4.978.06c.133-.004.257.048.366.162.148.152.222.398.222.738 0 .14-.016.29-.048.451l-.384 1.862c-.034.163-.088.288-.163.373-.074.086-.162.128-.262.128-.102 0-.185-.04-.25-.119-.064-.08-.114-.202-.149-.368l-.495-2.252c-.022-.102-.033-.184-.033-.247 0-.195.053-.348.158-.458.084-.089.184-.138.292-.15l.002-.001c.036-.004.071-.007.107-.008.036-.003.072-.006.109-.008.036-.002.072-.003.108-.003.037-.001.073-.001.11-.002zm.832 0c.205-.003.38.068.51.215.154.175.232.426.232.753 0 .16-.02.332-.058.517l-.354 1.688c-.037.168-.096.299-.177.392-.082.093-.18.14-.296.14-.155 0-.28-.07-.373-.209-.094-.14-.141-.326-.141-.56 0-.035.002-.078.007-.13l.266-1.55-.002-.002c.02-.146.03-.262.03-.349 0-.137-.025-.24-.077-.31-.051-.07-.126-.104-.225-.104-.075 0-.16.028-.255.085l.07-.388c.16-.066.305-.109.435-.127.035-.006.07-.01.105-.013.035-.003.07-.006.105-.008.035-.002.07-.003.105-.004.035-.001.07-.001.105-.002.035-.001.07-.001.106-.002.035-.001.07-.002.106-.003z"/>
                      </svg>
                    </div>
                    <CardTitle className="text-xl">WooCommerce</CardTitle>
                    <CardDescription>
                      Monitore conflitos de plugins, falhas de pagamento e queda de performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Ver Monitoramento WooCommerce
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              {/* Nuvemshop */}
              <Link href="/monitoramento-nuvemshop" className="group">
                <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 group-hover:-translate-y-1">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#2C68F6]/10">
                      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="#2C68F6">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                      </svg>
                    </div>
                    <CardTitle className="text-xl">Nuvemshop</CardTitle>
                    <CardDescription>
                      Receba alertas automáticos de problemas que podem afetar suas vendas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Ver Monitoramento Nuvemshop
                    </Button>
                  </CardContent>
                </Card>
              </Link>
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

        {/* Pricing Section */}
        <section id="pricing" className="container py-24 bg-muted/50">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Planos e Preços
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
                Escolha o plano ideal para o seu negócio
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-700 dark:text-green-400 rounded-full">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Todos os planos incluem 7 dias de teste grátis
                </span>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
              {/* Free Plan */}
              <Card className="relative">
                <CardHeader>
                  <CardTitle className="text-2xl">Teste Gratuito</CardTitle>
                  <CardDescription>
                    Experimente todas as funcionalidades básicas
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">R$ 0</span>
                    <span className="text-muted-foreground">/7 dias</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    💳 Sem cartão de crédito necessário
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted rounded-lg p-3 mb-4">
                    <p className="text-xs text-muted-foreground">
                      Teste perfeito para conhecer o PulseWatch e validar se atende suas necessidades
                    </p>
                  </div>

                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">1 loja monitorada</span>
                        <p className="text-xs text-muted-foreground">Ideal para começar</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Verificação a cada 10 min</span>
                        <p className="text-xs text-muted-foreground">Monitoramento constante</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Alertas via email</span>
                        <p className="text-xs text-muted-foreground">Notificações instantâneas</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Monitoramento de estoque</span>
                        <p className="text-xs text-muted-foreground">Alertas de produtos esgotados</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Dashboard básico</span>
                        <p className="text-xs text-muted-foreground">Visão geral da sua loja</p>
                      </div>
                    </li>
                  </ul>

                  <div className="pt-2 border-t">
                    <Link href="/auth/signup" className="w-full block">
                      <Button variant="outline" className="w-full" size="lg">
                        Começar Teste Grátis
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Premium Plan */}
              <Card className="relative border-primary shadow-lg">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    Mais Popular
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl">Premium</CardTitle>
                  <CardDescription>
                    Para lojistas que levam seu negócio a sério
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">R$ 29,99</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    🎉 Cancele quando quiser, sem multas
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-primary mb-1">
                      ⚡ O que torna o Premium especial:
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Monitore todas as suas lojas, receba alertas 2x mais rápidos e tenha controle total sobre seu negócio
                    </p>
                  </div>
                  
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Lojas ilimitadas</span>
                        <p className="text-xs text-muted-foreground">Monitore quantas lojas quiser</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Verificação a cada 5 min</span>
                        <p className="text-xs text-muted-foreground">Detecção 2x mais rápida de problemas</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Email + Telegram</span>
                        <p className="text-xs text-muted-foreground">Alertas instantâneos onde você estiver</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Histórico completo</span>
                        <p className="text-xs text-muted-foreground">Análise de todos os eventos passados</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Dashboard avançado</span>
                        <p className="text-xs text-muted-foreground">Métricas e insights detalhados</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Suporte prioritário</span>
                        <p className="text-xs text-muted-foreground">Resposta em até 24h</p>
                      </div>
                    </li>
                  </ul>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-center text-muted-foreground mb-3">
                      ✨ Experimente grátis por 7 dias, sem compromisso
                    </p>
                    <Link href="/auth/signup" className="w-full block">
                      <Button className="w-full" size="lg">
                        Começar Teste Grátis
                      </Button>
                    </Link>
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
