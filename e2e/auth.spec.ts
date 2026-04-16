import { test, expect } from '@playwright/test'

/**
 * Fluxo de autenticação — login, signup, logout, estados de erro.
 * Requer: app em http://localhost:3000
 */

test.describe('Autenticação — Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
  })

  test('renderiza a página de login corretamente', async ({ page }) => {
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('exibe erro ao submeter campos vazios', async ({ page }) => {
    await page.click('button[type="submit"]')
    // Aguarda feedback de validação (HTML5 ou mensagem customizada)
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeFocused()
  })

  test('exibe erro com credenciais inválidas', async ({ page }) => {
    await page.fill('input[type="email"]', 'usuario-invalido@teste.com')
    await page.fill('input[type="password"]', 'senha-errada-123')
    await page.click('button[type="submit"]')
    // Aguarda mensagem de erro visível
    await expect(page.locator('text=/inválid|incorret|erro|error/i')).toBeVisible({ timeout: 8000 })
  })

  test('mobile viewport — página de login', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/auth/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })
})

test.describe('Autenticação — Signup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signup')
  })

  test('renderiza a página de cadastro corretamente', async ({ page }) => {
    await expect(page).toHaveURL(/\/auth\/signup/)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('mobile viewport — página de cadastro', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/auth/signup')
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })
})

test.describe('Autenticação — Proteção de rotas', () => {
  test('redireciona para login ao acessar /dashboard sem sessão', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/login|\/auth\/signup/, { timeout: 8000 })
  })

  test('redireciona para login ao acessar /stores sem sessão', async ({ page }) => {
    await page.goto('/stores')
    await expect(page).toHaveURL(/\/auth\/login|\/auth\/signup/, { timeout: 8000 })
  })

  test('redireciona para login ao acessar /alerts sem sessão', async ({ page }) => {
    await page.goto('/alerts')
    await expect(page).toHaveURL(/\/auth\/login|\/auth\/signup/, { timeout: 8000 })
  })
})
