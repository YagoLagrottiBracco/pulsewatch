# 🔍 PulseWatch

**Micro-SaaS de Monitoramento de E-commerce com Alertas Automáticos**

PulseWatch é uma solução profissional que monitora lojas de e-commerce (Shopify, WooCommerce, Nuvemshop) e envia alertas automáticos via Email (SMTP Supabase) e Telegram.

## 🚀 Features

- ✅ **Detecção Automática de Plataforma** - Identifica automaticamente Shopify, WooCommerce ou Nuvemshop
- ✅ **Monitoramento em Tempo Real** - Verifica status da loja, estoque e vendas a cada 10 minutos
- ✅ **Alertas Multi-Canal** - Email (SMTP nativo Supabase) e Telegram
- ✅ **Dashboard Completo** - Visualize produtos, pedidos, alertas e configurações
- ✅ **Landing Page SEO-Optimizada** - LP profissional com Lighthouse SEO > 90
- ✅ **Autenticação Segura** - Supabase Auth com RLS

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js 14 (App Router), React 18, TailwindCSS, shadcn/ui
- **Backend**: Supabase (Auth, Database, Edge Functions, Cron)
- **Email**: NodeMailer + Supabase SMTP
- **Mensageria**: Telegram Bot API
- **Deploy**: Vercel + Supabase

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local com suas credenciais Supabase e Telegram

# Inicializar Supabase
npx supabase init

# Rodar migrations
npx supabase db push

# Rodar em desenvolvimento
npm run dev
```

## 🗄️ Banco de Dados

O projeto usa Supabase com as seguintes tabelas:

- `user_profiles` - Perfis de usuário com configurações
- `stores` - Lojas cadastradas
- `products` - Produtos importados
- `orders` - Pedidos monitorados
- `alerts` - Alertas gerados
- `alert_rules` - Regras de alertas personalizadas
- `leads` - Leads da landing page

## 🔐 Configuração

### Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Copie as credenciais para `.env.local`
3. Execute as migrations em `supabase/migrations`

### Telegram Bot

1. Crie um bot com [@BotFather](https://t.me/botfather)
2. Copie o token para `.env.local`
3. Configure o webhook em `/api/telegram/webhook`

### Email SMTP

Configure as credenciais SMTP do Supabase em `.env.local`

## 📱 Como Usar

1. **Cadastre-se** na plataforma
2. **Adicione sua loja** informando o domínio
3. **Configure tokens** (se necessário)
4. **Conecte o Telegram** (opcional)
5. **Configure alertas** personalizados
6. **Monitore** via dashboard

## 🚀 Deploy

### Vercel

```bash
vercel --prod
```

### Supabase Edge Functions

```bash
npx supabase functions deploy check_status
```

## 📝 Licença

MIT License - veja LICENSE para mais detalhes.

## 🤝 Contribuindo

Contribuições são bem-vindas! Abra issues ou PRs.

---

Desenvolvido com ❤️ para e-commerce
