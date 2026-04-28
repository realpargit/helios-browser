import { parse } from 'node-html-parser'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const CONSENT = 'CONSENT=YES+cb.20210720-07-p0.en+FX+410; SOCS=CAESHAgBEhJnd3NfMjAyMzExMjctMF9SQzIaAmVuIAEaBgiAvMyqBg'

const q = process.argv[2] || 'pizza'
const url = `https://www.google.com/search?gbv=1&pws=0&hl=en&num=20&q=${encodeURIComponent(q)}`

const res = await fetch(url, { headers: { 'User-Agent': UA, 'Cookie': CONSENT, 'Accept-Language': 'en-US,en;q=0.9' } })
console.log('status', res.status)
const html = await res.text()
console.log('len', html.length)
console.log('blocked?', /unusual traffic|sorry\.google\.com/i.test(html))
console.log('has /url?', html.includes('/url?'))

const root = parse(html)
const anchors = root.querySelectorAll('a')
console.log('anchor count', anchors.length)
let urlAnchors = 0
for (const a of anchors) {
  const h = a.getAttribute('href') || ''
  if (h.startsWith('/url?')) urlAnchors++
}
console.log('/url? anchors', urlAnchors)
console.log('---FIRST 1500 CHARS---')
console.log(html.slice(0, 1500))
console.log('---ANCHOR HREFS---')
for (const a of anchors) console.log(a.getAttribute('href'))

let n = 0
for (const a of anchors) {
  const h = a.getAttribute('href') || ''
  if (!h.startsWith('/url?')) continue
  const u = new URL(h, 'https://www.google.com')
  const real = u.searchParams.get('q')
  const h3 = a.querySelector('h3')
  const title = (h3 ? h3.text : a.text).trim().slice(0, 80)
  console.log(`#${++n} ${title} → ${real?.slice(0, 80)}`)
  if (n >= 10) break
}
