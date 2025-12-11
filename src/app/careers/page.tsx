import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/navbar'
import { Briefcase, TrendingUp, Users, Zap, Heart, Coffee, Laptop, Globe } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Carreiras - PulseWatch | Junte-se ao Nosso Time',
  description: 'Faça parte do time PulseWatch e ajude a revolucionar o monitoramento de e-commerce no Brasil. Veja nossas vagas abertas.',
  openGraph: {
    title: 'Carreiras - PulseWatch',
    description: 'Faça parte do time PulseWatch e ajude a revolucionar o monitoramento de e-commerce no Brasil.',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function CareersPage() {
  const openPositions = [
    {
      title: 'Desenvolvedor Full Stack Sênior',
      type: 'Tempo Integral',
      location: 'Remoto',
      department: 'Engenharia',
      description: 'Procuramos um desenvolvedor experiente em Next.js, React e Node.js para construir features incríveis.',
    },
    {
      title: 'Product Designer',
      type: 'Tempo Integral',
      location: 'Remoto',
      department: 'Design',
      description: 'Ajude a criar experiências excepcionais para nossos usuários com design centrado no usuário.',
    },
    {
      title: 'Customer Success Manager',
      type: 'Tempo Integral',
      location: 'São Paulo',
      department: 'Sucesso do Cliente',
      description: 'Garanta que nossos clientes obtenham o máximo valor da nossa plataforma.',
    },
  ]

  const benefits = [
    {
      icon: Laptop,
      title: 'Trabalho Remoto',
      description: 'Trabalhe de onde quiser, com horários flexíveis',
    },
    {
      icon: TrendingUp,
      title: 'Crescimento Acelerado',
      description: 'Oportunidades reais de crescimento e desenvolvimento',
    },
    {
      icon: Coffee,
      title: 'Benefícios Premium',
      description: 'Vale refeição, plano de saúde e auxílio home office',
    },
    {
      icon: Users,
      title: 'Time de Alta Performance',
      description: 'Trabalhe com profissionais talentosos e apaixonados',
    },
    {
      icon: Zap,
      title: 'Ambiente Inovador',
      description: 'Cultura de experimentação e aprendizado contínuo',
    },
    {
      icon: Globe,
      title: 'Impacto Real',
      description: 'Seu trabalho impacta milhares de lojistas',
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 pt-24">
        {/* Hero Section */}
        <section className="container py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-6" variant="outline">
              <Briefcase className="h-3 w-3 mr-1" />
              Carreiras
            </Badge>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
              Construa o Futuro
              <span className="block bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Do E-commerce Conosco
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Estamos em busca de pessoas apaixonadas, talentosas e que querem fazer a diferença no ecossistema de e-commerce brasileiro.
            </p>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="container py-16 border-y bg-muted/30">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-black text-center mb-12">Por Que PulseWatch?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mb-4">
                      <benefit.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-bold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section className="container py-20">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black mb-4">Vagas Abertas</h2>
              <p className="text-lg text-muted-foreground">
                Não encontrou a vaga ideal? Envie seu currículo para <a href="mailto:jobs@pulsewatch.click" className="text-primary hover:underline">jobs@pulsewatch.click</a>
              </p>
            </div>

            <div className="space-y-6">
              {openPositions.map((position, index) => (
                <Card key={index} className="hover:shadow-xl transition-all hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-2xl mb-2">{position.title}</CardTitle>
                        <CardDescription className="text-base">{position.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Badge variant="secondary">{position.type}</Badge>
                      <Badge variant="outline">{position.location}</Badge>
                      <Badge variant="outline">{position.department}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Link href="/contact">
                      <Button className="w-full sm:w-auto">
                        Candidatar-se
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            {openPositions.length === 0 && (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-bold mb-2">Nenhuma vaga aberta no momento</h3>
                  <p className="text-muted-foreground mb-6">
                    Mas estamos sempre em busca de talentos! Envie seu currículo mesmo assim.
                  </p>
                  <Link href="/contact">
                    <Button variant="outline">Entrar em Contato</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Culture Section */}
        <section className="container py-16 border-t bg-muted/30">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-black mb-6">Nossa Cultura</h2>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold mb-2">Pessoas em Primeiro Lugar</h3>
                <p className="text-sm text-muted-foreground">
                  Valorizamos o bem-estar e desenvolvimento de cada membro do time
                </p>
              </div>
              <div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold mb-2">Inovação Constante</h3>
                <p className="text-sm text-muted-foreground">
                  Encorajamos experimentação e aprendizado com os erros
                </p>
              </div>
              <div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold mb-2">Colaboração</h3>
                <p className="text-sm text-muted-foreground">
                  Trabalhamos juntos para alcançar objetivos extraordinários
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Pronto Para Fazer a Diferença?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Junte-se a nós e ajude a construir o futuro do monitoramento de e-commerce.
            </p>
            <Link href="/contact">
              <Button size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-xl">
                Enviar Currículo
              </Button>
            </Link>
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
