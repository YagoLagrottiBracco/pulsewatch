/**
 * Corrige dois bugs introduzidos pelo script add-sentry-to-routes.mjs:
 * 1. import { captureError } inserido no meio de bloco import { multi-linha
 * 2. Backslashes Windows no module string causando escape inválido
 */
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { globSync } from 'glob'

const ROOT = process.cwd()
const SENTRY_IMPORT = "import { captureError } from '@/lib/sentry'"

const files = [
  ...globSync('src/app/api/**/*.ts', { cwd: ROOT }),
  ...globSync('src/services/*.ts', { cwd: ROOT }),
].filter(f => !f.includes('__tests__') && !f.includes('.test.'))

let fixedFiles = 0

for (const relPath of files) {
  const fullPath = join(ROOT, relPath)
  let content = readFileSync(fullPath, 'utf-8')
  let changed = false

  // ── Fix 1: backslashes no module string ─────────────────────────────────
  // Estratégia simples: dentro de qualquer string de module captureError,
  // substituir \ por / e limpar o prefixo Windows/POSIX
  if (content.includes("module: 'src")) {
    const fixed = content.replace(/module: 'src[^']+'/g, (match) => {
      const clean = match
        .replace(/\\/g, '/')       // backslash → forward slash
        .replace(/^module: 'src\/app\/api\//, "module: 'api/")
        .replace(/\/route\.ts'$/, "'")
        .replace(/\.ts'$/, "'")
      return clean
    })
    if (fixed !== content) {
      content = fixed
      changed = true
    }
  }

  // ── Fix 2: import misplaced inside multi-line import block ───────────────
  // Padrão: "import {\nimport { captureError }..."
  if (content.includes(`import {\n${SENTRY_IMPORT}`)) {
    // Remove a linha misplaced de dentro do bloco
    content = content.replace(`import {\n${SENTRY_IMPORT}\n`, 'import {\n')
    changed = true

    // Reinsere o import após o último bloco de imports completo
    if (!content.includes(SENTRY_IMPORT)) {
      const lines = content.split('\n')
      let lastImportLine = -1
      let insideBlock = false

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        // Início de import multi-linha: "import {" sem fechar na mesma linha
        if (/^import\s+\{/.test(line) && !line.includes("} from '")) {
          insideBlock = true
        }
        // Fim de bloco multi-linha: linha com "} from '..."
        if (insideBlock && /^\}\s+from\s+'/.test(line.trim())) {
          insideBlock = false
          lastImportLine = i
          continue
        }
        // Import de uma linha
        if (!insideBlock && /^import\s/.test(line)) {
          lastImportLine = i
        }
      }

      if (lastImportLine >= 0) {
        lines.splice(lastImportLine + 1, 0, SENTRY_IMPORT)
        content = lines.join('\n')
      }
    }
  }

  if (changed) {
    writeFileSync(fullPath, content, 'utf-8')
    fixedFiles++
    console.log(`✓ fixed: ${relPath}`)
  }
}

console.log(`\nTotal: ${fixedFiles} arquivos corrigidos`)
