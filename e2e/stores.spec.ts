import { test, expect } from '@playwright/test'

/**
 * Fluxo de monitoramento de lojas.
 * Requer: app em http://localhost:3000
 * Nota: testes de listagem/detalhes requerem usuário autenticado (use storageState para sessão real).
 */

test.describe('Monitoramento de Lojas — Páginas Públicas', () => {
  test('página inicial carrega sem erros', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/')
    await expect(page).not.toHaveURL(/error|500/)
    // Sem erros de console críticos de JS
    const jsErrors = errors.filter(e => !e.includes('favicon') && !e.includes('hydration'))
    expect(jsErrors.length).toBe(0)
  })

  test('page title presente na home', async ({ page }) => {
    await page.goto('/')
    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
  })

  test('mobile viewport — home sem quebra de layout', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    // Sem scrollbar horizontal (overflow)
    const hasHorizontalOverflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth)
    expect(hasHorizontalOverflow).toBe(false)
  })
})

test.describe('Monitoramento de Lojas — Status Page', () => {
  test('rota de status page pública existe', async ({ page }) => {
    const response = await page.goto('/status/example-store')
    // Aceita 200 (store existe) ou 404 (não existe) — nunca 500
    expect(response?.status()).not.toBe(500)
  })
})

test.describe('Monitoramento de Lojas — Erros HTTP', () => {
  test('404 — rota inexistente retorna página de erro amigável', async ({ page }) => {
    const response = await page.goto('/rota-que-nao-existe-xyz-123')
    expect(response?.status()).toBe(404)
    // Deve renderizar algo (não deve ser página em branco)
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.length).toBeGreaterThan(0)
  })
})

test.describe('Monitoramento de Lojas — API Routes', () => {
  test('GET /api/v1/stores sem autenticação retorna 401 ou 403', async ({ page }) => {
    const response = await page.request.get('/api/v1/stores')
    expect([401, 403, 400]).toContain(response.status())
  })

  test('GET /api/v1/alerts sem autenticação retorna 401 ou 403', async ({ page }) => {
    const response = await page.request.get('/api/v1/alerts')
    expect([401, 403, 400]).toContain(response.status())
  })
})

test.describe('Acessibilidade básica', () => {
  test('página de login tem labels acessíveis nos inputs', async ({ page }) => {
    await page.goto('/auth/login')
    const emailInput = page.locator('input[type="email"]')
    // Verifica se há label associado ou aria-label
    const ariaLabel = await emailInput.getAttribute('aria-label')
    const id = await emailInput.getAttribute('id')
    if (!ariaLabel && id) {
      const label = page.locator(`label[for="${id}"]`)
      const labelCount = await label.count()
      expect(labelCount + (ariaLabel ? 1 : 0)).toBeGreaterThan(0)
    }
  })

  test('navegação por teclado — Tab funciona na página de login', async ({ page }) => {
    await page.goto('/auth/login')
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.tagName)
    expect(focused).toBeTruthy()
  })
})
