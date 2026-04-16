'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Global Error Boundary para o Next.js App Router.
 * Captura erros não tratados em toda a aplicação.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { type: 'global_error_boundary' },
      extra: { digest: error.digest },
    })
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '16px',
          fontFamily: 'system-ui, sans-serif',
          padding: '24px',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            Algo deu errado
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            Ocorreu um erro inesperado. Nossa equipe foi notificada automaticamente.
          </p>
          <button
            onClick={reset}
            style={{
              padding: '10px 20px',
              background: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}
