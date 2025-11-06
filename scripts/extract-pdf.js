import fs from 'node:fs'
import path from 'node:path'
import pdf from 'pdf-parse'

async function main() {
  const input = process.argv[2]
  const output = process.argv[3] || ''
  if (!input) {
    console.error('Usage: node scripts/extract-pdf.js <input.pdf> [output.txt]')
    process.exit(1)
  }
  const buf = fs.readFileSync(input)
  const data = await pdf(buf)
  if (output) {
    fs.writeFileSync(output, data.text, 'utf8')
    console.log(`wrote: ${output}`)
  } else {
    process.stdout.write(data.text)
  }
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
