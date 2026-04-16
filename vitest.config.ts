import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**', '**/.next/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/lib/utils.ts',
        'src/lib/export-utils.ts',
        'src/lib/alert-checklists.ts',
        'src/services/financial-loss.ts',
        'src/services/platform-detector.ts',
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 98, // 2 branches são artefatos do V8 em cadeias ||/&&
        statements: 100,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
