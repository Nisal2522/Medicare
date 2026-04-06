#!/usr/bin/env node
/**
 * Run `npm run build` in every folder under backend/ that has package.json with a "build" script.
 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const backendRoot = path.join(root, 'backend')

if (!fs.existsSync(backendRoot)) {
  console.error('backend/ not found')
  process.exit(1)
}

const dirs = fs
  .readdirSync(backendRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)

let failed = 0
for (const name of dirs) {
  const pkgPath = path.join(backendRoot, name, 'package.json')
  if (!fs.existsSync(pkgPath)) continue
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  if (!pkg.scripts?.build) {
    console.log(`[skip] ${name} (no build script)`)
    continue
  }
  console.log(`\n=== backend/${name} ===`)
  try {
    execSync('npm run build', {
      cwd: path.join(backendRoot, name),
      stdio: 'inherit',
      shell: true,
    })
  } catch {
    failed += 1
  }
}

if (failed > 0) {
  console.error(`\n${failed} backend build(s) failed.`)
  process.exit(1)
}
console.log('\nAll backend builds passed.')
