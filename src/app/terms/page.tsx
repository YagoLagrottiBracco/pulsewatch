import { Navbar } from '@/components/navbar'
import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso - PulseWatch',
  description: 'Termos de Uso do PulseWatch. Leia os termos e condições para utilização do nosso serviço de monitoramento.',
  robots: {
    index: true,
    follow: true,
  },
}

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 pt-24">
        <section className="container py-20">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <Badge className="mb-6" variant="outline">
                <FileText className="h-3 w-3 mr-1" />
                Legal
              </Badge>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
                Termos de
                <span className="block bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Uso
                </span>
              </h1>
              <p className="text-muted-foreground">
                Última atualização: {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>

            <div className="prose prose-lg max-w-none">
              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">1. Aceitação dos Termos</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Ao acessar e utilizar a plataforma PulseWatch ("Serviço"), você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com estes termos, não utilize nosso Serviço.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">2. Descrição do Serviço</h2>
                <p className="text-muted-foreground leading-relaxed">
                  O PulseWatch é uma plataforma de monitoramento automatizado para e-commerce que oferece:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
                  <li>Monitoramento 24/7 de lojas online (Shopify, WooCommerce, Nuvemshop)</li>
                  <li>Detecção automática de problemas e anomalias</li>
                  <li>Sistema de alertas em tempo real via email e Telegram</li>
                  <li>Análise de disponibilidade e performance</li>
                  <li>Dashboard com métricas e relatórios</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">3. Cadastro e Conta</h2>
                <h3 className="text-xl font-semibold mb-3 mt-6">3.1 Requisitos</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Para utilizar o Serviço, você deve:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-2">
                  <li>Ter pelo menos 18 anos de idade</li>
                  <li>Fornecer informações precisas e completas</li>
                  <li>Manter suas credenciais de acesso seguras</li>
                  <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">3.2 Responsabilidade da Conta</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Você é totalmente responsável por todas as atividades realizadas em sua conta e deve garantir a confidencialidade de suas credenciais de acesso.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">4. Planos e Pagamentos</h2>
                <h3 className="text-xl font-semibold mb-3 mt-6">4.1 Período de Teste</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Oferecemos um período de teste gratuito de 7 dias. Não é necessário cartão de crédito para iniciar o teste. Após o período de teste, você deverá escolher um plano pago para continuar utilizando o Serviço.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Cobrança</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Os planos são cobrados mensalmente ou anualmente, conforme sua escolha</li>
                  <li>As cobranças são processadas automaticamente no início de cada período</li>
                  <li>Você será notificado por email antes de cada cobrança</li>
                  <li>Todos os preços estão em Reais (BRL) e incluem impostos aplicáveis</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">4.3 Cancelamento e Reembolso</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Você pode cancelar sua assinatura a qualquer momento. O acesso ao Serviço permanecerá ativo até o final do período de cobrança pago. Não oferecemos reembolsos proporcionais para cancelamentos no meio do período, exceto quando exigido por lei.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">5. Uso Aceitável</h2>
                <h3 className="text-xl font-semibold mb-3 mt-6">5.1 Você Concorda em NÃO:</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Usar o Serviço para fins ilegais ou não autorizados</li>
                  <li>Tentar obter acesso não autorizado a sistemas ou redes</li>
                  <li>Interferir ou interromper o funcionamento do Serviço</li>
                  <li>Transmitir vírus, malware ou código malicioso</li>
                  <li>Fazer engenharia reversa ou tentar extrair código-fonte</li>
                  <li>Usar bots, scrapers ou ferramentas automatizadas não autorizadas</li>
                  <li>Revender ou redistribuir o Serviço sem autorização</li>
                  <li>Monitorar sites sem permissão do proprietário</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">5.2 Consequências</h3>
                <p className="text-muted-foreground leading-relaxed">
                  A violação destes termos pode resultar na suspensão ou encerramento imediato de sua conta, sem reembolso.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">6. Disponibilidade do Serviço</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Embora nos esforcemos para manter o Serviço disponível 24/7, não podemos garantir disponibilidade ininterrupta. Podemos realizar manutenções programadas, que serão comunicadas com antecedência sempre que possível. Não nos responsabilizamos por perdas decorrentes de indisponibilidade temporária.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">7. Propriedade Intelectual</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Todo o conteúdo, recursos e tecnologia do PulseWatch são de propriedade exclusiva da empresa ou de seus licenciadores. Isto inclui, mas não se limita a:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
                  <li>Código-fonte, design e interface do usuário</li>
                  <li>Logotipos, marcas registradas e identidade visual</li>
                  <li>Textos, gráficos e materiais de marketing</li>
                  <li>Algoritmos e metodologias de monitoramento</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">8. Limitação de Responsabilidade</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  O Serviço é fornecido "como está" e "conforme disponível". Na máxima extensão permitida por lei:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Não garantimos que o Serviço atenderá suas necessidades específicas</li>
                  <li>Não somos responsáveis por perdas de vendas, lucros ou dados</li>
                  <li>Não nos responsabilizamos por falhas em detectar problemas em lojas monitoradas</li>
                  <li>Nossa responsabilidade total não excederá o valor pago nos últimos 12 meses</li>
                  <li>Não somos responsáveis por ações de terceiros ou plataformas de e-commerce</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">9. Indenização</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Você concorda em indenizar e isentar o PulseWatch, seus diretores, funcionários e parceiros de quaisquer reclamações, danos ou despesas resultantes de seu uso do Serviço ou violação destes Termos.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">10. Modificações dos Termos</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Reservamo-nos o direito de modificar estes Termos a qualquer momento. Alterações significativas serão notificadas por email com pelo menos 30 dias de antecedência. O uso continuado do Serviço após as alterações constitui aceitação dos novos termos.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">11. Rescisão</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Podemos suspender ou encerrar seu acesso ao Serviço imediatamente, sem aviso prévio, se:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Você violar estes Termos de Uso</li>
                  <li>Houver atividade fraudulenta ou ilegal</li>
                  <li>Houver inadimplência de pagamento</li>
                  <li>Por motivos legais ou regulatórios</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">12. Lei Aplicável e Jurisdição</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Estes Termos são regidos pelas leis da República Federativa do Brasil. Quaisquer disputas serão resolvidas nos tribunais da comarca de São Paulo, SP, com renúncia expressa a qualquer outro foro, por mais privilegiado que seja.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">13. Disposições Gerais</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Se qualquer disposição destes Termos for considerada inválida, as demais permanecerão em pleno vigor. A não aplicação de qualquer direito aqui previsto não constitui renúncia. Estes Termos constituem o acordo integral entre você e o PulseWatch.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4">14. Contato</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Para questões sobre estes Termos de Uso, entre em contato:
                </p>
                <ul className="list-none space-y-2 text-muted-foreground mt-4">
                  <li><strong>Email:</strong> <a href="mailto:legal@pulsewatch.click" className="text-primary hover:underline">legal@pulsewatch.click</a></li>
                  <li><strong>Suporte:</strong> <a href="mailto:contato@pulsewatch.click" className="text-primary hover:underline">contato@pulsewatch.click</a></li>
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
