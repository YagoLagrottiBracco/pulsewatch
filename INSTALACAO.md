# 🚀 Guia de Instalação - PulseWatch

Este guia detalha todos os passos para configurar e executar o PulseWatch localmente ou em produção.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no [Supabase](https://supabase.com)
- Git instalado
- Editor de código (VS Code recomendado)

## 📦 1. Instalação das Dependências

```bash
cd pulsewatch
npm install
```

Este comando instalará todas as dependências listadas no `package.json`, incluindo:
- Next.js 14
- React 18
- Supabase cliente
- TailwindCSS
- shadcn/ui components
- NodeMailer
- Lucide Icons

## 🗄️ 2. Configuração do Supabase

### 2.1 Criar Projeto no Supabase

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Clique em "New Project"
3. Preencha:
   - **Nome**: PulseWatch
   - **Password**: Escolha uma senha segura
   - **Region**: Escolha a região mais próxima

### 2.2 Executar Migrations

Após criar o projeto, execute as migrations para criar as tabelas:

```bash
# Inicializar Supabase local (opcional)
npx supabase init

# Ou aplicar direto no projeto remoto via Dashboard do Supabase:
# SQL Editor > New Query > Cole o conteúdo de:
```

Copie e execute no **SQL Editor** do Supabase:

1. `supabase/migrations/20240101000000_initial_schema.sql`
2. `supabase/migrations/20240101000001_rls_policies.sql`

### 2.3 Configurar Edge Functions

```bash
# Login no Supabase CLI
npx supabase login

# Link seu projeto
npx supabase link --project-ref SEU_PROJECT_REF

# Deploy da função de monitoramento
npx supabase functions deploy check_status
```

### 2.4 Ativar Cron Job

No Dashboard do Supabase:
1. Vá em **Database** > **Functions**
2. Encontre `check_status`
3. Configure o cron para rodar a cada 10 minutos

## ⚙️ 3. Configuração do Ambiente

### 3.1 Criar arquivo `.env.local`

```bash
cp .env.local.example .env.local
```

### 3.2 Preencher variáveis de ambiente

Edite `.env.local` com suas credenciais:

```env
# Supabase - Encontre em: Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Email SMTP - Configure no Supabase: Settings > SMTP
SMTP_HOST=smtp.supabase.co
SMTP_PORT=587
SMTP_USER=seu_usuario_smtp
SMTP_PASSWORD=sua_senha_smtp
SMTP_FROM_EMAIL=noreply@pulsewatch.com
SMTP_FROM_NAME=PulseWatch

# Telegram Bot
# 1. Crie um bot com @BotFather no Telegram
# 2. Copie o token que ele fornecer
TELEGRAM_BOT_TOKEN=seu_bot_token_aqui
TELEGRAM_WEBHOOK_SECRET=um_secret_aleatorio

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🤖 4. Configurar Telegram Bot

### 4.1 Criar Bot

1. Abra o Telegram
2. Procure por [@BotFather](https://t.me/botfather)
3. Envie `/newbot`
4. Siga as instruções
5. Copie o **token** fornecido

### 4.2 Configurar Webhook (depois do deploy)

```bash
# Após fazer deploy da aplicação, configure o webhook:
curl -X POST "https://api.telegram.org/bot<SEU_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://seu-app.vercel.app/api/telegram/webhook"}'
```

## 🎨 5. Configurar shadcn/ui (Opcional)

Os componentes já estão incluídos, mas se quiser adicionar mais:

```bash
npx shadcn-ui@latest add [component-name]
```

## 🚀 6. Executar em Desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## 📤 7. Deploy em Produção

### 7.1 Deploy Frontend (Vercel)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Ou conecte via GitHub:
# 1. Push para GitHub
# 2. Importe no Vercel: https://vercel.com/new
# 3. Configure as variáveis de ambiente
# 4. Deploy automático
```

### 7.2 Configurar Variáveis de Ambiente no Vercel

No painel do Vercel:
1. Settings > Environment Variables
2. Adicione todas as variáveis do `.env.local`
3. Redeploy

### 7.3 Deploy Edge Functions (Supabase)

```bash
npx supabase functions deploy check_status
```

## ✅ 8. Verificação da Instalação

### Checklist:

- [ ] `npm run dev` funciona sem erros
- [ ] Supabase conectado (sem erros 403/401)
- [ ] Tabelas criadas (verifique no Supabase Dashboard)
- [ ] RLS policies ativas
- [ ] Edge Function deployed
- [ ] Cron job configurado
- [ ] Email SMTP configurado
- [ ] Telegram bot criado
- [ ] Variáveis de ambiente configuradas

### Teste Manual:

1. **Criar Conta**: Vá em `/auth/signup` e crie uma conta
2. **Adicionar Loja**: No dashboard, adicione uma loja teste
3. **Verificar Detecção**: A plataforma deve ser detectada automaticamente
4. **Aguardar 10min**: Espere o cron job rodar
5. **Verificar Alertas**: Confira se alertas aparecem

## 🐛 9. Troubleshooting

### Erro: "Failed to fetch products"

- Verifique se o domínio da loja está correto
- Confirme que a loja está online
- Para WooCommerce/Nuvemshop, configure as credenciais de API

### Erro: "Email not sent"

- Verifique configurações SMTP no Supabase
- Confirme credenciais em `.env.local`
- Teste email manualmente no Supabase Dashboard

### Erro: "Telegram notifications failed"

- Verifique se o `TELEGRAM_BOT_TOKEN` está correto
- Configure o webhook corretamente
- Teste enviando `/start` para o bot

### Edge Function não roda

- Verifique logs: `npx supabase functions logs check_status`
- Confirme que variáveis de ambiente estão configuradas
- Redeploy: `npx supabase functions deploy check_status --no-verify-jwt`

## 📚 10. Próximos Passos

- [ ] Personalizar landing page
- [ ] Configurar domínio customizado
- [ ] Adicionar analytics (Plausible, Umami, etc.)
- [ ] Implementar pagamentos (Stripe)
- [ ] Adicionar mais plataformas de e-commerce
- [ ] Criar documentação para usuários

## 🆘 Suporte

Problemas? Abra uma issue no GitHub ou envie email para suporte@pulsewatch.com

## 📄 Licença

MIT License - veja LICENSE para detalhes.

---

**Desenvolvido com ❤️ para e-commerce**
