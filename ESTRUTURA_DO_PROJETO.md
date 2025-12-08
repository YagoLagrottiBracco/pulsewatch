# 📁 Estrutura do Projeto PulseWatch

## 📂 Visão Geral da Arquitetura

```
pulsewatch/
├── src/                          # Código fonte da aplicação
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx           # Layout principal com SEO
│   │   ├── page.tsx             # Landing page otimizada
│   │   └── globals.css          # Estilos globais Tailwind
│   │
│   ├── components/               # Componentes React
│   │   └── ui/                  # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── badge.tsx
│   │
│   ├── lib/                      # Bibliotecas e utilitários
│   │   ├── utils.ts             # Funções utilitárias (cn)
│   │   ├── database.types.ts    # Types do banco Supabase
│   │   └── supabase/            # Configuração Supabase
│   │       ├── client.ts        # Cliente browser
│   │       ├── server.ts        # Cliente server
│   │       └── middleware.ts    # Middleware auth
│   │
│   ├── services/                 # Serviços de negócio
│   │   ├── email.ts             # Envio de emails (SMTP)
│   │   ├── telegram.ts          # Envio de Telegram
│   │   └── platform-detector.ts # Detecção de plataforma
│   │
│   └── integrations/             # Integrações com e-commerce
│       ├── shopify.ts           # Cliente Shopify
│       ├── woocommerce.ts       # Cliente WooCommerce
│       └── nuvemshop.ts         # Cliente Nuvemshop
│
├── supabase/                     # Configuração Supabase
│   ├── config.toml              # Configuração local
│   ├── migrations/              # Migrations SQL
│   │   ├── 20240101000000_initial_schema.sql
│   │   └── 20240101000001_rls_policies.sql
│   │
│   └── functions/               # Edge Functions (Deno)
│       ├── check_status/        # Função de monitoramento
│       │   └── index.ts
│       └── _shared/             # Código compartilhado
│           └── cors.ts
│
├── public/                       # Arquivos estáticos
│   └── (imagens, fonts, etc.)
│
├── .env.local.example           # Exemplo de variáveis de ambiente
├── package.json                 # Dependências npm
├── tsconfig.json                # Configuração TypeScript
├── tailwind.config.ts           # Configuração Tailwind
├── next.config.js               # Configuração Next.js
├── middleware.ts                # Middleware global Next.js
├── README.md                    # Documentação principal
├── INSTALACAO.md                # Guia de instalação
└── ESTRUTURA_DO_PROJETO.md      # Este arquivo
```

## 🗄️ Banco de Dados (Supabase PostgreSQL)

### Tabelas Principais

1. **user_profiles**
   - Perfis de usuário com configurações
   - `telegram_chat_id`, `email_notifications`, etc.

2. **stores**
   - Lojas cadastradas
   - Campos: `domain`, `platform`, `status`, `last_check`

3. **products**
   - Produtos importados das lojas
   - Sync automático via edge function

4. **orders**
   - Pedidos monitorados
   - Importação automática

5. **alerts**
   - Alertas gerados pelo sistema
   - Campos: `type`, `severity`, `email_sent`, `telegram_sent`

6. **alert_rules**
   - Regras personalizadas de alertas
   - Configurável por usuário/loja

7. **leads**
   - Leads da landing page
   - Formulário de contato

### Row Level Security (RLS)

Todas as tabelas possuem políticas RLS ativas:
- Usuários só veem seus próprios dados
- Service role pode inserir alertas
- Leads são públicos para insert

## ⚙️ Serviços e Integrações

### 📧 Email Service (`services/email.ts`)

**Funcionalidades:**
- Envio via SMTP nativo do Supabase (NodeMailer)
- Templates HTML responsivos
- Funções:
  - `sendEmail()` - Envio genérico
  - `sendEmailAlert()` - Alerta formatado
  - `sendWelcomeEmail()` - Boas-vindas

### 📱 Telegram Service (`services/telegram.ts`)

**Funcionalidades:**
- Envio via API oficial do Telegram
- Formatação HTML
- Funções:
  - `sendTelegramMessage()` - Mensagem genérica
  - `sendTelegramAlert()` - Alerta formatado
  - `setTelegramWebhook()` - Configurar webhook
  - `verifyTelegramBot()` - Verificar bot

### 🔍 Platform Detector (`services/platform-detector.ts`)

**Detecção Automática:**
- Shopify: `/products.json`, `Shopify.theme`
- WooCommerce: `/wp-json/wc/store/products`
- Nuvemshop: `nuvemshop.com.br`, `d26lpennugtm8s.cloudfront.net`

**Retorna:**
```typescript
{
  platform: 'shopify' | 'woocommerce' | 'nuvemshop' | 'unknown',
  confidence: number, // 0-100
  indicators: string[] // Lista de sinais detectados
}
```

### 🛒 Integrações de E-commerce

#### Shopify (`integrations/shopify.ts`)
- API pública: `/products.json` (sem auth)
- Admin API: Requer `accessToken`
- Métodos:
  - `fetchProducts()`
  - `fetchOrders()`
  - `fetchInventory()`
  - `checkStatus()`

#### WooCommerce (`integrations/woocommerce.ts`)
- Store API: `/wp-json/wc/store/products` (sem auth)
- REST API: Requer `consumerKey` e `consumerSecret`
- Métodos: iguais ao Shopify

#### Nuvemshop (`integrations/nuvemshop.ts`)
- API v1: Requer `accessToken` e `storeId`
- Métodos: iguais ao Shopify
- Endpoint: `api.nuvemshop.com.br/v1/{storeId}/products`

## 🔄 Edge Function - Monitoramento

### `supabase/functions/check_status/index.ts`

**Executado a cada 10 minutos via Cron**

**Fluxo:**
1. Busca todas lojas ativas
2. Para cada loja:
   - Verifica se está online
   - Atualiza status no banco
   - Sincroniza produtos
   - Detecta problemas:
     - Loja offline
     - Produtos esgotados
     - Estoque baixo
   - Cria alertas
   - Envia notificações (email + telegram)

**Tipos de Alertas:**
- `LOJA_OFFLINE` (critical)
- `LOJA_ONLINE` (low)
- `PRODUTO_ESGOTADO` (high)
- `ESTOQUE_BAIXO` (medium)
- `ERRO_IMPORTACAO` (medium)

## 🎨 Frontend - Componentes

### Landing Page (`src/app/page.tsx`)

**SEO Otimizado:**
- Meta tags completas
- OpenGraph tags
- JSON-LD structured data
- Lighthouse SEO > 90

**Seções:**
1. **Hero** - CTA principal
2. **Features** - 6 cards de recursos
3. **How It Works** - 3 passos
4. **CTA Final** - Formulário de lead

### Componentes UI (shadcn/ui)

Biblioteca de componentes acessíveis e customizáveis:
- `Button` - Botões com variants
- `Card` - Cards para conteúdo
- `Input` - Inputs de formulário
- `Label` - Labels de formulário
- `Badge` - Badges de status

## 🔐 Autenticação e Middleware

### Middleware Global (`middleware.ts`)

**Proteção de Rotas:**
- Rotas protegidas: `/dashboard`, `/stores`, `/products`, `/alerts`, `/settings`
- Redirect para `/auth/login` se não autenticado
- Usa Supabase SSR

### Supabase Auth

**Configuração:**
- Email/Password
- Social OAuth (Google, GitHub) - configurável
- Email confirmations desabilitado por padrão
- JWT expiry: 3600s (1h)

## 📦 Dependências Principais

### Produção
- `next` 14.0.4 - Framework React
- `react` 18.2.0 - Biblioteca UI
- `@supabase/supabase-js` - Cliente Supabase
- `@supabase/ssr` - SSR para Supabase
- `tailwindcss` - CSS framework
- `shadcn/ui` - Componentes UI
- `lucide-react` - Ícones
- `nodemailer` - Envio de emails

### Desenvolvimento
- `typescript` - Tipagem estática
- `eslint` - Linter
- `autoprefixer` - CSS prefixes

## 🚀 Deploy

### Frontend (Vercel)
```bash
vercel
```

**Requer:**
- Variáveis de ambiente configuradas
- GitHub/GitLab conectado (opcional)

### Backend (Supabase)
```bash
npx supabase functions deploy check_status
```

**Requer:**
- Supabase CLI autenticado
- Projeto linkado

## 🔧 Configuração de Desenvolvimento

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar `.env.local`
```bash
cp .env.local.example .env.local
# Editar com suas credenciais
```

### 3. Executar
```bash
npm run dev
```

### 4. Build
```bash
npm run build
npm start
```

## 📊 Fluxo de Dados

```
Usuario → Dashboard → Adiciona Loja → DB (stores)
                                        ↓
                            Cron (10min) → Edge Function
                                        ↓
                            Platform Detector → Identifica plataforma
                                        ↓
                            Integration Client → Busca dados
                                        ↓
                            DB → Salva produtos/pedidos
                                        ↓
                            Alert Engine → Detecta problemas
                                        ↓
                            DB (alerts) → Cria alertas
                                        ↓
                            Notification Service → Email + Telegram
                                        ↓
                            User → Recebe alerta
```

## 🎯 Próximas Melhorias

- [ ] Dashboard analytics
- [ ] Gráficos de vendas
- [ ] Exportação de relatórios
- [ ] Integração com Stripe
- [ ] App mobile (React Native)
- [ ] Webhooks personalizados
- [ ] Multi-idioma (i18n)
- [ ] Testes automatizados

---

**Documentação completa em:** [README.md](./README.md)
**Guia de instalação:** [INSTALACAO.md](./INSTALACAO.md)
