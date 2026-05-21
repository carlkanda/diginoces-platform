import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const npmCacheDir = resolve('.npm-cache')
mkdirSync(npmCacheDir, { recursive: true })

const platformPackage =
  process.platform === 'win32'
    ? process.arch === 'arm64'
      ? 'cli-windows-arm64'
      : 'cli-windows-x64'
    : process.platform === 'darwin'
      ? process.arch === 'arm64'
        ? 'cli-darwin-arm64'
        : 'cli-darwin-x64'
      : process.arch === 'arm64'
        ? 'cli-linux-arm64'
        : 'cli-linux-x64'

const localGoBinary = resolve(
  'node_modules',
  '@supabase',
  platformPackage,
  'bin',
  process.platform === 'win32' ? 'supabase-go.exe' : 'supabase-go',
)

const command = existsSync(localGoBinary)
  ? localGoBinary
  : process.platform === 'win32'
    ? 'npx.cmd'
    : 'npx'
const args = existsSync(localGoBinary)
  ? [
      'db',
      'lint',
      '--linked',
      '--schema',
      'public,app_private',
      '--fail-on',
      'error',
    ]
  : [
      'supabase@latest',
      'db',
      'lint',
      '--linked',
      '--schema',
      'public,app_private',
      '--fail-on',
      'error',
    ]

const result = spawnSync(
  command,
  args,
  {
    env: {
      ...process.env,
      npm_config_cache: npmCacheDir,
    },
    shell: process.platform === 'win32' && !existsSync(localGoBinary),
    stdio: 'inherit',
  },
)

if (result.error) {
  console.error(result.error.message)
}

process.exit(result.status ?? 1)
