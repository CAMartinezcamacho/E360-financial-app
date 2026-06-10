// Build script for Capacitor (Android/iOS) static export.
// Temporarily hides app/api/ so Next.js doesn't try to statically export
// server-only API routes, then restores them after the build.
import { renameSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const apiDir = join(root, 'app', 'api')
const apiBackup = join(root, 'app', '_api_bak')

let moved = false

function restore() {
  if (moved && existsSync(apiBackup)) {
    renameSync(apiBackup, apiDir)
    console.log('✓ app/api restored')
  }
}

process.on('exit', restore)
process.on('SIGINT', () => { restore(); process.exit(1) })
process.on('uncaughtException', (e) => { restore(); throw e })

try {
  if (existsSync(apiDir)) {
    renameSync(apiDir, apiBackup)
    moved = true
    console.log('→ app/api temporarily hidden for static export')
  }

  execSync('cross-env BUILD_FOR_CAPACITOR=1 next build', {
    stdio: 'inherit',
    cwd: root,
  })
} finally {
  restore()
}
