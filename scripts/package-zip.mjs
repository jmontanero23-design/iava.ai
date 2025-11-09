#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import archiver from 'archiver'

const root = process.cwd()
const distDir = path.join(root, 'dist')
const outDir = path.join(root, 'release')
const outZip = path.join(outDir, 'iava-ai-web.zip')

if (!fs.existsSync(distDir)) {
  console.log('dist/ not found; running build...')
  const r = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true })
  if (r.status !== 0) {
    console.error('Build failed')
    process.exit(r.status || 1)
  }
}

fs.mkdirSync(outDir, { recursive: true })
const output = fs.createWriteStream(outZip)
const archive = archiver('zip', { zlib: { level: 9 } })

output.on('close', () => {
  console.log(`ZIP created: ${outZip} (${archive.pointer()} bytes)`) 
})
archive.on('warning', (err) => { if (err.code !== 'ENOENT') throw err })
archive.on('error', (err) => { throw err })

archive.pipe(output)
archive.directory(distDir, false)
archive.finalize()

