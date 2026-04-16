/**
 * Script de instrumentação automática do Sentry nas API routes.
 * Adiciona import e captureError em cada catch block de API routes.
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, relative } from 'path'
import { globSync } from 'glob'

const ROOT = process.cwd()
const SENTRY_IMPORT = "import { captureError } from '@/lib/sentry'"

const files = globSync('src/app/api/**/*.ts', { cwd: ROOT })
  .filter(f => !f.includes('__tests__') && !f.includes('.test.'))

let totalFiles = 0
let totalCatches = 0

for (const relPath of files) {
  const fullPath = join(ROOT, relPath)
  let content = readFileSync(fullPath, 'utf-8')

  // Pular se já tem Sentry
  if (content.includes('captureError') || content.includes('@sentry')) continue

  // Verificar se tem catch blocks com error
  if (!content.includes('} catch (error') && !content.includes('} catch (err')) continue

  // Determinar o nome do módulo para o contexto do Sentry
  const moduleName = relPath
    .replace('src/app/api/', '')
    .replace('/route.ts', '')
    .replace(/\[([^\]]+)\]/g, ':$1')

  // Adicionar import após o último import existente
  const lastImportMatch = content.match(/(^import .+$\n?)+/m)
  if (lastImportMatch) {
    const lastImportEnd = content.lastIndexOf('\nimport ')
    const lineEnd = content.indexOf('\n', lastImportEnd + 1)
    content = content.slice(0, lineEnd + 1) + SENTRY_IMPORT + '\n' + content.slice(lineEnd + 1)
  }

  // Contar e instrumentar catch blocks
  // Padrão: } catch (error...) { ... console.error ou throw ou return
  const catchPattern = /(\} catch \(error(?::[^)]+)?\) \{)/g
  const matches = [...content.matchAll(catchPattern)]

  if (matches.length === 0) continue

  // Substituir cada catch adicionando captureError como primeira linha
  content = content.replace(
    /(\} catch \(error(?::[^)]+)?\) \{)\n(\s+)/g,
    (match, catchBlock, indent) => {
      totalCatches++
      return `${catchBlock}\n${indent}captureError(error, { module: '${moduleName}' })\n${indent}`
    }
  )

  // Fazer o mesmo para catch (err...)
  content = content.replace(
    /(\} catch \(err(?::[^)]+)?\) \{)\n(\s+)/g,
    (match, catchBlock, indent) => {
      totalCatches++
      return `${catchBlock}\n${indent}captureError(err, { module: '${moduleName}' })\n${indent}`
    }
  )

  writeFileSync(fullPath, content, 'utf-8')
  totalFiles++
  console.log(`✓ ${relPath} (module: ${moduleName})`)
}

console.log(`\nTotal: ${totalFiles} arquivos modificados, ${totalCatches} catch blocks instrumentados`)
