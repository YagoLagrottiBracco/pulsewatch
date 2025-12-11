import { Navbar } from '@/components/navbar'
import { Badge } from '@/components/ui/badge'
import { Shield } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade - PulseWatch',
  description: 'Política de Privacidade do PulseWatch. Entenda como coletamos, usamos e protegemos seus dados.',
  robots: {
    index: true,
    follow: true,
  },
}

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 pt-24">
        <section className="container py-20">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <Badge className="mb-6" variant="outline">
                <Shield className="h-3 w-3 mr-1" />
                Legal
              </Badge>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
                Política de
                <span className="block bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Privacidade
                </span>
              </h1>
              <p className="text-muted-foreground">
                Última atualização: {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>

            <div className="prose prose-lg max-w-none">
              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">1. Introdução</h2>
                <p className="text-muted-foreground leading-relaxed">
                  A PulseWatch ("nós", "nosso" ou "empresa") está comprometida em proteger sua privacidade. Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações quando você utiliza nosso serviço de monitoramento de e-commerce.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">2. Informações que Coletamos</h2>
                <h3 className="text-xl font-semibold mb-3 mt-6">2.1 Informações Fornecidas por Você</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Nome, email e informações de contato</li>
                  <li>Informações de pagamento (processadas por terceiros seguros)</li>
                  <li>URLs das lojas que você deseja monitorar</li>
                  <li>Configurações de alertas e preferências</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Informações Coletadas Automaticamente</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Dados de uso do serviço (páginas visitadas, recursos utilizados)</li>
                  <li>Informações de dispositivo e navegador</li>
                  <li>Endereço IP e dados de localização</li>
                  <li>Cookies e tecnologias similares</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">3. Como Usamos Suas Informações</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Utilizamos suas informações para:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Fornecer, operar e manter nosso serviço de monitoramento</li>
                  <li>Processar suas transações e gerenciar sua conta</li>
                  <li>Enviar alertas e notificações sobre sua loja</li>
                  <li>Melhorar e personalizar sua experiência</li>
                  <li>Comunicar atualizações, ofertas e novidades</li>
                  <li>Prevenir fraudes e garantir a segurança</li>
                  <li>Cumprir obrigações legais</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">4. Compartilhamento de Informações</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Não vendemos suas informações pessoais. Podemos compartilhar dados com:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Provedores de Serviços:</strong> Empresas que nos ajudam a operar o serviço (hospedagem, pagamentos, analytics)</li>
                  <li><strong>Parceiros de Negócios:</strong> Com seu consentimento explícito</li>
                  <li><strong>Autoridades Legais:</strong> Quando exigido por lei ou para proteger nossos direitos</li>
                  <li><strong>Sucessores de Negócio:</strong> Em caso de fusão, aquisição ou venda de ativos</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">5. Segurança dos Dados</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Implementamos medidas técnicas e organizacionais adequadas para proteger suas informações, incluindo:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
                  <li>Criptografia SSL/TLS para transmissão de dados</li>
                  <li>Armazenamento seguro em servidores protegidos</li>
                  <li>Controles de acesso rigorosos</li>
                  <li>Monitoramento contínuo de segurança</li>
                  <li>Auditorias regulares de segurança</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">6. Seus Direitos (LGPD)</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Confirmar a existência de tratamento de seus dados</li>
                  <li>Acessar seus dados pessoais</li>
                  <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
                  <li>Solicitar a anonimização, bloqueio ou eliminação de dados</li>
                  <li>Revogar seu consentimento</li>
                  <li>Solicitar a portabilidade de dados</li>
                  <li>Opor-se ao tratamento de dados</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Para exercer seus direitos, entre em contato conosco através de: <a href="mailto:privacidade@pulsewatch.click" className="text-primary hover:underline">privacidade@pulsewatch.click</a>
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">7. Retenção de Dados</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Mantemos suas informações pessoais pelo tempo necessário para cumprir os propósitos descritos nesta política, a menos que um período de retenção mais longo seja exigido ou permitido por lei. Dados de monitoramento e alertas são mantidos por até 12 meses, salvo requisitos legais ou contratuais específicos.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">8. Cookies</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Utilizamos cookies e tecnologias similares para melhorar sua experiência. Você pode gerenciar suas preferências de cookies através das configurações do navegador. Para mais informações, consulte nossa <a href="/cookies" className="text-primary hover:underline">Política de Cookies</a>.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">9. Transferência Internacional de Dados</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Seus dados podem ser transferidos e mantidos em servidores localizados fora do Brasil. Garantimos que tais transferências estejam em conformidade com a LGPD e que medidas adequadas de proteção sejam implementadas.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">10. Alterações nesta Política</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre alterações significativas através do email cadastrado ou por meio de aviso em nosso site. A continuidade do uso do serviço após as alterações constitui sua aceitação da nova política.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">11. Contato</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Se você tiver dúvidas sobre esta Política de Privacidade ou sobre o tratamento de seus dados pessoais, entre em contato:
                </p>
                <ul className="list-none space-y-2 text-muted-foreground mt-4">
                  <li><strong>Email:</strong> <a href="mailto:privacidade@pulsewatch.click" className="text-primary hover:underline">privacidade@pulsewatch.click</a></li>
                  <li><strong>Encarregado de Dados (DPO):</strong> dpo@pulsewatch.click</li>
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
