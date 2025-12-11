import { Navbar } from '@/components/navbar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Cookie } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Cookies - PulseWatch',
  description: 'Política de Cookies do PulseWatch. Entenda como utilizamos cookies e tecnologias similares.',
  robots: {
    index: true,
    follow: true,
  },
}

export default function CookiesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 pt-24">
        <section className="container py-20">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <Badge className="mb-6" variant="outline">
                <Cookie className="h-3 w-3 mr-1" />
                Legal
              </Badge>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
                Política de
                <span className="block bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Cookies
                </span>
              </h1>
              <p className="text-muted-foreground">
                Última atualização: {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>

            <div className="prose prose-lg max-w-none">
              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">1. O Que São Cookies?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Cookies são pequenos arquivos de texto armazenados no seu dispositivo (computador, tablet ou smartphone) quando você visita um site. Eles são amplamente utilizados para fazer os sites funcionarem de forma mais eficiente, além de fornecer informações aos proprietários do site.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">2. Como Usamos Cookies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  O PulseWatch utiliza cookies para:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Manter você conectado à sua conta</li>
                  <li>Lembrar suas preferências e configurações</li>
                  <li>Analisar como você usa nosso serviço</li>
                  <li>Melhorar a performance e experiência do usuário</li>
                  <li>Proteger contra fraudes e melhorar a segurança</li>
                  <li>Personalizar conteúdo e recomendações</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">3. Tipos de Cookies que Utilizamos</h2>
                
                <div className="space-y-6 mt-6">
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-bold mb-3">3.1 Cookies Essenciais</h3>
                      <p className="text-muted-foreground mb-2">
                        <strong>Finalidade:</strong> Necessários para o funcionamento básico do site
                      </p>
                      <p className="text-muted-foreground mb-2">
                        <strong>Duração:</strong> Sessão ou até 1 ano
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Exemplos:</strong> Autenticação de usuário, segurança, preferências de idioma
                      </p>
                      <p className="text-sm text-muted-foreground mt-3 italic">
                        *Estes cookies não podem ser desativados pois são essenciais para o funcionamento do serviço.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-bold mb-3">3.2 Cookies de Performance</h3>
                      <p className="text-muted-foreground mb-2">
                        <strong>Finalidade:</strong> Coletar informações sobre como você usa nosso site
                      </p>
                      <p className="text-muted-foreground mb-2">
                        <strong>Duração:</strong> Até 2 anos
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Exemplos:</strong> Google Analytics, métricas de uso, análise de comportamento
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-bold mb-3">3.3 Cookies de Funcionalidade</h3>
                      <p className="text-muted-foreground mb-2">
                        <strong>Finalidade:</strong> Lembrar suas escolhas e personalizar sua experiência
                      </p>
                      <p className="text-muted-foreground mb-2">
                        <strong>Duração:</strong> Até 1 ano
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Exemplos:</strong> Preferências de tema (escuro/claro), configurações de dashboard
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-bold mb-3">3.4 Cookies de Marketing</h3>
                      <p className="text-muted-foreground mb-2">
                        <strong>Finalidade:</strong> Rastrear sua atividade para publicidade direcionada
                      </p>
                      <p className="text-muted-foreground mb-2">
                        <strong>Duração:</strong> Até 2 anos
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Exemplos:</strong> Google Ads, Facebook Pixel, remarketing
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">4. Cookies de Terceiros</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Utilizamos serviços de terceiros que podem definir cookies em seu dispositivo:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Google Analytics:</strong> Para análise de tráfego e comportamento do usuário</li>
                  <li><strong>Stripe:</strong> Para processamento seguro de pagamentos</li>
                  <li><strong>Supabase:</strong> Para autenticação e armazenamento de dados</li>
                  <li><strong>Vercel:</strong> Para hospedagem e CDN</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Cada um desses serviços tem sua própria política de privacidade e cookies, que recomendamos que você leia.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">5. Como Gerenciar Cookies</h2>
                <h3 className="text-xl font-semibold mb-3 mt-6">5.1 Configurações do Navegador</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Você pode controlar e gerenciar cookies através das configurações do seu navegador. A maioria dos navegadores permite:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Ver quais cookies estão armazenados</li>
                  <li>Excluir todos ou cookies específicos</li>
                  <li>Bloquear cookies de terceiros</li>
                  <li>Bloquear cookies de sites específicos</li>
                  <li>Excluir todos os cookies ao fechar o navegador</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">5.2 Links para Configurações de Navegadores</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener" className="text-primary hover:underline">Google Chrome</a></li>
                  <li><a href="https://support.mozilla.org/pt-BR/kb/cookies" target="_blank" rel="noopener" className="text-primary hover:underline">Mozilla Firefox</a></li>
                  <li><a href="https://support.apple.com/pt-br/guide/safari/sfri11471/mac" target="_blank" rel="noopener" className="text-primary hover:underline">Safari</a></li>
                  <li><a href="https://support.microsoft.com/pt-br/microsoft-edge" target="_blank" rel="noopener" className="text-primary hover:underline">Microsoft Edge</a></li>
                </ul>

                <p className="text-sm text-muted-foreground mt-6 p-4 bg-muted/50 rounded-lg">
                  ⚠️ <strong>Atenção:</strong> Desabilitar cookies pode afetar a funcionalidade do site e sua experiência de usuário. Alguns recursos podem não funcionar corretamente sem cookies.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">6. Armazenamento Local</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Além de cookies, também utilizamos tecnologias de armazenamento local (localStorage e sessionStorage) para armazenar informações como:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
                  <li>Tokens de autenticação</li>
                  <li>Preferências de interface</li>
                  <li>Cache de dados para melhor performance</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Essas tecnologias funcionam de forma similar aos cookies, mas permitem armazenar mais dados localmente no seu navegador.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">7. Duração dos Cookies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Utilizamos dois tipos de cookies quanto à duração:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Cookies de Sessão:</strong> São temporários e expiram quando você fecha o navegador</li>
                  <li><strong>Cookies Persistentes:</strong> Permanecem no seu dispositivo até expirarem ou serem excluídos manualmente (até 2 anos)</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">8. Consentimento</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Ao continuar usando nosso site após ser informado sobre o uso de cookies, você consente com nossa Política de Cookies. Você pode retirar seu consentimento a qualquer momento ajustando as configurações do navegador ou entrando em contato conosco.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">9. Atualizações desta Política</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Podemos atualizar esta Política de Cookies periodicamente para refletir mudanças em nossas práticas ou por outras razões operacionais, legais ou regulatórias. Verifique esta página regularmente para se manter informado.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">10. Mais Informações</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Para mais informações sobre como processamos seus dados pessoais, consulte nossa <a href="/privacy" className="text-primary hover:underline">Política de Privacidade</a>.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Para questões específicas sobre cookies, entre em contato:
                </p>
                <ul className="list-none space-y-2 text-muted-foreground mt-4">
                  <li><strong>Email:</strong> <a href="mailto:privacidade@pulsewatch.click" className="text-primary hover:underline">privacidade@pulsewatch.click</a></li>
                </ul>
              </section>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-muted/30 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} PulseWatch. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
