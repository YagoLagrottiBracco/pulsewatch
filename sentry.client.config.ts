import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  // Captura 100% dos replays em sessões com erro
  replaysOnErrorSampleRate: 1.0,
  // 10% de replays em sessões normais
  replaysSessionSampleRate: 0.1,
  integrations: [
    Sentry.replayIntegration(),
  ],
  // Não capturar erros de extensões de browser
  ignoreErrors: [
    'Non-Error promise rejection captured',
    /chrome-extension/,
    /safari-extension/,
  ],
})
