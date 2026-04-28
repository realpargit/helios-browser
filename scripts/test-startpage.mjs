import { parse } from 'node-html-parser'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const q = process.argv[2] || 'pizza'
const url = `https://www.startpage.com/sp/search?query=${encodeURIComponent(q)}&cat=web`

const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' } })
const html = await res.text()
const root = parse(html)
const blocks = root.querySelectorAll('.result')
console.log('blocks', blocks.length)
let n = 0
for (const block of blocks) {
  const titleEl = block.querySelector('.result-title') || block.querySelector('h2') || block.querySelector('h3')
  const linkEl  = block.querySelector('a.result-link') || titleEl?.querySelector('a') || null
  const href    = (linkEl?.getAttribute('href') || '').trim()
  const title   = (titleEl?.text || linkEl?.text || '').trim().slice(0, 80)
  let snippet = ''
  for (const d of block.querySelectorAll('p, .description')) {
    const t = (d.text || '').trim()
    if (t && t.length > 20 && !t.includes(title)) { snippet = t.slice(0, 100); break }
  }
  if (!/^https?:/.test(href)) continue
  console.log(`#${++n} ${title}\n   ${href.slice(0, 80)}\n   ${snippet}`)
  if (n >= 5) break
}
