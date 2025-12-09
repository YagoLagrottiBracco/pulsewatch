# 💳 Configuração do Stripe - PulseWatch

## 📋 Visão Geral

Sistema de pagamentos implementado com Stripe para assinatura PRO do PulseWatch.

### Planos:
- **FREE**: Trial de 7 dias (automático ao criar conta)
- **PRO**: Assinatura mensal via Stripe

---

## 🚀 Configuração Inicial

### 1. Criar Conta no Stripe

1. Acesse: https://dashboard.stripe.com/register
2. Crie sua conta
3. Ative modo de teste primeiro

### 2. Obter Chaves da API

**Dashboard → Developers → API Keys:**

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### 3. Criar Produto e Preço

**Dashboard → Products → Add product:**

1. **Nome**: PulseWatch PRO
2. **Descrição**: Plano PRO com recursos ilimitados
3. **Preço**: R$ 29,90/mês (ou valor desejado)
4. **Billing period**: Monthly
5. **Salvar** e copiar o **Price ID**:

```env
STRIPE_PRICE_ID_PRO_MONTHLY=price_...
```

### 4. Configurar Webhook

**Dashboard → Developers → Webhooks → Add endpoint:**

**URL do Webhook:**
```
https://seudominio.com/api/stripe/webhook
```

**Eventos para escutar:**
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**Copiar Webhook Secret:**
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 📦 Instalação

```bash
npm install stripe
```

---

## 🔧 Variáveis de Ambiente

Adicione no `.env.local`:

```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO_MONTHLY=price_...

# App
NEXT_PUBLIC_APP_URL=https://seudominio.com
```

---

## 🗄️ Aplicar Migrations

```bash
# Fazer push das migrations para o Supabase
supabase db push

# Ou se estiver local
supabase migration up
```

---

## 🧪 Testar no Modo de Desenvolvimento

### 1. Testar Webhook Localmente

**Instalar Stripe CLI:**
```bash
# Windows (via Scoop)
scoop install stripe

# Mac
brew install stripe/stripe-cli/stripe

# Linux
# Veja: https://stripe.com/docs/stripe-cli
```

**Fazer Login:**
```bash
stripe login
```

**Forward Webhooks:**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Copiar o webhook secret exibido e adicionar no `.env.local`**

### 2. Testar Checkout

1. Execute o projeto: `npm run dev`
2. Acesse: http://localhost:3000/settings
3. Clique em "⚡ Upgrade para PRO"
4. Use cartão de teste: `4242 4242 4242 4242`
5. Qualquer data futura e qualquer CVV

**Cartões de teste:**
- `4242 4242 4242 4242` - Sucesso
- `4000 0000 0000 0002` - Recusado

---

## 🌐 Deploy em Produção

### 1. Ativar Modo Live

1. Dashboard Stripe → Mudar de **Test** para **Live**
2. Obter novas chaves de produção
3. Atualizar environment variables no Vercel

### 2. Configurar Webhook de Produção

1. Criar novo webhook apontando para produção
2. Atualizar `STRIPE_WEBHOOK_SECRET` no Vercel

### 3. Verificar

1. Fazer um pagamento de teste real (será cobrado)
2. Verificar se webhook foi recebido
3. Confirmar atualização no banco

---

## 📊 Fluxo de Pagamento

```
1. Usuário clica em "Upgrade para PRO"
   ↓
2. API cria Checkout Session
   ↓
3. Usuário é redirecionado para Stripe
   ↓
4. Usuário paga
   ↓
5. Stripe envia webhook checkout.session.completed
   ↓
6. API atualiza user_profiles:
   - plan: 'pro'
   - subscription_status: 'active'
   - stripe_subscription_id
   ↓
7. Usuário é redirecionado de volta
   ↓
8. UI mostra "PRO" badge
```

---

## 🔄 Gerenciamento de Assinatura

### Cancelamento

O usuário pode cancelar no **Stripe Customer Portal** ou você pode adicionar um botão:

```typescript
// Em settings/page.tsx
const handleCancelSubscription = async () => {
  // Redirecionar para Customer Portal
  const response = await fetch('/api/stripe/create-portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user?.id }),
  })
  
  const { url } = await response.json()
  window.location.href = url
}
```

### Reativação

Quando assinatura é cancelada, o webhook `customer.subscription.deleted` é disparado e faz downgrade para FREE.

---

## 🛡️ Segurança

✅ **Implementado:**
- Webhook signature verification
- Server-side payment processing
- Secure API keys (nunca no frontend)
- User authentication checks

---

## 📈 Métricas

**Dashboard Stripe** mostra:
- MRR (Monthly Recurring Revenue)
- Churn rate
- Active subscriptions
- Failed payments

---

## 🐛 Troubleshooting

### Webhook não está sendo recebido

1. Verificar URL do webhook
2. Verificar eventos selecionados
3. Ver logs no Dashboard → Developers → Webhooks

### Pagamento não atualiza o banco

1. Ver logs no Vercel
2. Verificar se webhook secret está correto
3. Testar localmente com Stripe CLI

### Trial não é criado automaticamente

1. Verificar se migration foi aplicada
2. Verificar trigger `on_user_profile_created`
3. Ver logs do Supabase

---

## ✅ Checklist de Produção

- [ ] Stripe modo Live ativado
- [ ] Chaves de produção configuradas
- [ ] Webhook de produção configurado
- [ ] Migrations aplicadas
- [ ] Teste de pagamento realizado
- [ ] Verificar webhook recebido
- [ ] Confirmar atualização no banco
- [ ] Customer Portal configurado (opcional)

---

**🎉 Sistema de pagamentos pronto para uso!**
