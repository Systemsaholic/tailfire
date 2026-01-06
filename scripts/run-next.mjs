import { spawn } from 'node:child_process'
import path from 'node:path'
import { PORTS } from '../packages/config/ports.js'

const mode = process.argv[2] || 'dev'
const appName = path.basename(process.cwd())

const port = PORTS[appName]
if (!port) {
  console.error(
    `Unknown app "${appName}". Expected one of: ${Object.keys(PORTS).join(
      ', '
    )}`
  )
  process.exit(1)
}

if (mode !== 'dev' && mode !== 'start') {
  console.error('Usage: node ../../scripts/run-next.mjs <dev|start>')
  process.exit(1)
}

const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const nextArgs = ['exec', 'next', mode, '-p', String(port)]

const child = spawn(pnpmCmd, nextArgs, {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: {
    ...process.env,
  },
})

child.on('exit', (code) => {
  process.exit(code ?? 1)
})
