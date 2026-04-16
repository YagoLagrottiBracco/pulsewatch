import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  // Captura breadcrumbs de console no servidor
  integrations: [
    Sentry.consoleIntegration(),
  ],
})
