# 🚀 Guia de Deploy - PulseWatch

## Opções de Deploy

### 1️⃣ Deploy via Vercel (Recomendado) ⭐

#### Opção A: Deploy via GitHub (Mais Fácil)

**Passo 1: Criar Repositório no GitHub**
```bash
cd pulsewatch
git init
git add .
git commit -m "Initial commit - PulseWatch"

# Criar repositório no GitHub e depois:
git remote add origin https://github.com/SEU_USUARIO/pulsewatch.git
git push -u origin main
```

**Passo 2: Deploy no Vercel**
1. Acesse [vercel.com](https://vercel.com)
2. Clique em "Add New Project"
3. Importe o repositório do GitHub
4. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASSWORD`
   - `SMTP_FROM_EMAIL`
   - `SMTP_FROM_NAME`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_APP_URL`
5. Clique em "Deploy"
6. ✅ Pronto! Seu app estará em `https://pulsewatch.vercel.app`

#### Opção B: Deploy via CLI

**Passo 1: Instalar Vercel CLI**
```bash
npm install -g vercel
```

**Passo 2: Login**
```bash
vercel login
```

**Passo 3: Deploy**
```bash
# Deploy de teste
vercel

# Deploy de produção
vercel --prod
```

**Passo 4: Adicionar Variáveis de Ambiente**
```bash
# Via CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL

# Ou via Dashboard do Vercel
# Settings > Environment Variables
```

### 2️⃣ Deploy via Netlify

**Passo 1: Instalar Netlify CLI**
```bash
npm install -g netlify-cli
```

**Passo 2: Build**
```bash
npm run build
```

**Passo 3: Deploy**
```bash
netlify deploy --prod
```

### 3️⃣ Deploy via Railway

**Passo 1: Criar conta em [railway.app](https://railway.app)**

**Passo 2: Criar novo projeto**
```bash
railway login
railway init
railway up
```

**Passo 3: Adicionar variáveis**
```bash
railway variables set NEXT_PUBLIC_SUPABASE_URL=seu_valor
```

## 📋 Checklist Pré-Deploy

### ✅ Código
- [x] Build funciona: `npm run build`
- [x] Sem erros de lint: `npm run lint`
- [x] .env.local.example atualizado
- [x] .gitignore configurado
- [x] Security headers configurados
- [x] Performance otimizada

### ✅ Supabase
- [ ] Projeto criado
- [ ] Migrations aplicadas
- [ ] RLS policies ativas
- [ ] Credenciais copiadas

### ✅ Telegram
- [ ] Bot criado via @BotFather
- [ ] Token copiado
- [ ] Webhook configurado

### ✅ Email
- [ ] SMTP configurado no Supabase
- [ ] Credenciais testadas

## 🔐 Variáveis de Ambiente para Produção

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica
SUPABASE_SERVICE_ROLE_KEY=sua_chave_secreta

# Email SMTP (Supabase)
SMTP_HOST=smtp.supabase.co
SMTP_PORT=587
SMTP_USER=seu_usuario
SMTP_PASSWORD=sua_senha
SMTP_FROM_EMAIL=noreply@pulsewatch.com
SMTP_FROM_NAME=PulseWatch

# Telegram
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_WEBHOOK_SECRET=um_secret_aleatorio_seguro

# App
NEXT_PUBLIC_APP_URL=https://pulsewatch.vercel.app
```

## 🔄 CI/CD Automático (GitHub + Vercel)

Após conectar GitHub com Vercel:
1. Cada push no branch `main` → Deploy automático
2. Pull Requests → Preview deploy automático
3. Rollback com 1 clique
4. Logs e analytics integrados

## 📊 Monitoramento Pós-Deploy

### Vercel Analytics (Automático)
- Web Vitals
- Performance metrics
- Real user monitoring

### Adicionar manualmente:
1. **Sentry** (Error tracking)
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

2. **PostHog** (Analytics)
```bash
npm install posthog-js
```

3. **LogRocket** (Session replay)
```bash
npm install logrocket
```

## 🌐 Configurar Domínio Customizado

### No Vercel:
1. Settings > Domains
2. Add Domain: `pulsewatch.com`
3. Configure DNS:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. Aguardar propagação (até 48h)

## 🔧 Troubleshooting

### Erro: "Module not found"
```bash
# Limpar cache e reinstalar
rm -rf node_modules .next
npm install
npm run build
```

### Erro: "Build failed"
```bash
# Verificar logs no Vercel Dashboard
# Ou localmente:
npm run build 2>&1 | tee build.log
```

### Erro: "Environment variables not found"
- Verificar se adicionou no Vercel Dashboard
- Redeploy após adicionar variáveis

### Erro: Supabase connection
- Verificar URL e chaves
- Confirmar que projeto Supabase está ativo
- Testar localmente primeiro

## 📱 Telegram Webhook

Após deploy, configure o webhook:
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://seu-app.vercel.app/api/telegram/webhook"}'
```

## 🎯 Pós-Deploy

1. **Testar aplicação**
   - Criar conta
   - Adicionar loja
   - Verificar alertas

2. **Configurar Cron**
   - Deploy edge function no Supabase
   - Verificar execução

3. **Monitorar**
   - Vercel Analytics
   - Supabase logs
   - Error tracking

## 🚨 Rollback

### Via Vercel Dashboard:
1. Deployments
2. Selecionar deploy anterior
3. Promote to Production

### Via CLI:
```bash
vercel rollback
```

## 📈 Otimizações Pós-Deploy

1. **CDN**: Já configurado (Vercel)
2. **Cache**: Headers já configurados
3. **Compression**: Automático (Vercel)
4. **Image Optimization**: Usar `next/image`
5. **Analytics**: Ativar Vercel Analytics

## 🔗 Links Úteis

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deploy](https://nextjs.org/docs/deployment)
- [Supabase Docs](https://supabase.com/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

**Status**: ✅ Pronto para deploy!
**Tempo estimado**: 10-15 minutos
**Custo**: Gratuito (Vercel Hobby + Supabase Free)
