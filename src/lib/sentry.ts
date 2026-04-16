/**
 * Utilitário centralizado para captura de erros via Sentry.
 *
 * Use este módulo em vez de importar @sentry/nextjs diretamente
 * para facilitar troca de provider no futuro.
 */
import * as Sentry from '@sentry/nextjs'

export { Sentry }

/**
 * Captura uma exceção no Sentry com contexto adicional.
 * Sempre re-lança o erro — nunca engole exceções silenciosamente.
 */
export function captureError(
  error: unknown,
  context: {
    module: string
    extra?: Record<string, unknown>
    tags?: Record<string, string>
  }
): void {
  Sentry.captureException(error, {
    tags: { module: context.module, ...context.tags },
    extra: context.extra,
  })
}

/**
 * Captura evento de monitoramento de loja com contexto estruturado.
 */
export function captureStoreError(
  storeName: string,
  errorDetails: unknown,
  tags?: Record<string, string>
): void {
  Sentry.captureEvent({
    message: `Store monitoring failed: ${storeName}`,
    level: 'error',
    tags: { store: storeName, type: 'monitoring', ...tags },
    extra: { details: errorDetails },
  })
}

/**
 * Wrapper para API route handlers — captura exceções automaticamente.
 * Uso: export const GET = withSentryRoute('rota-nome', async (req) => { ... })
 */
export function withSentryRoute<T extends (...args: any[]) => Promise<Response>>(
  routeName: string,
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args)
    } catch (error) {
      captureError(error, {
        module: `api/${routeName}`,
        extra: { args: args.length },
      })
      throw error
    }
  }) as T
}
