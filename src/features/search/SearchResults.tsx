import { useEffect, useRef, useState } from 'react'
import { useBrowserStore } from '../../store/browserStore'
import logoUrl from '../../assets/logo.png'

type Result = { title: string; url: string; description: string; favicon?: string }
type Card = { title: string; description: string; url?: string; thumbnail?: string }

type Stage = 'cache' | 'fast' | 'full' | 'final'

function canon(u: string): string {
  try {
    const p = new URL(u)
    p.hash = ''
    return p.toString().toLowerCase()
  } catch { return u.toLowerCase() }
}

export function SearchResults({ query }: { query: string }) {
  const { activeTabId } = useBrowserStore()
  const h = (window as any).helios
  const [state, setState] = useState<{
    status: 'loading' | 'streaming' | 'done' | 'error'
    results: Result[]
    card?: Card
    sources?: string[]
    reason?: string
    elapsed?: number
    stage?: Stage
  }>({ status: 'loading', results: [] })
  const [input, setInput] = useState(query)
  const sessionIdRef = useRef<number>(0)
  const prefetchTimerRef = useRef<number | null>(null)

  useEffect(() => { setInput(query) }, [query])

  useEffect(() => {
    let unsub: (() => void) | null = null
    let cancelledLocal = false
    setState({ status: 'loading', results: [] })
    if (!query.trim()) {
      setState({ status: 'done', results: [] })
      return
    }

    h.search.start(query, false).then((res: { sessionId: number }) => {
      if (cancelledLocal) {
        h.search.cancel(res.sessionId)
        return
      }
      sessionIdRef.current = res.sessionId
    })

    unsub = h.search.onUpdate((u: any) => {
      if (cancelledLocal) return
      if (u.sessionId !== sessionIdRef.current && sessionIdRef.current !== 0) return
      // Late updates from older sessions are dropped.
      if (u.query !== query) return
      const env = u.envelope
      const elapsed = u.elapsedMs / 1000
      if (env.ok) {
        setState({
          status: u.stage === 'final' ? 'done' : 'streaming',
          results: env.results || [],
          card: env.card,
          sources: env.sources,
          stage: u.stage,
          elapsed
        })
      } else if (u.stage === 'final') {
        setState({ status: 'error', results: [], reason: env.reason })
      }
    })

    return () => {
      cancelledLocal = true
      if (sessionIdRef.current) h.search.cancel(sessionIdRef.current)
      if (unsub) unsub()
    }
  }, [query])

  // Debounced prefetch on the search input — Enter reuses inflight search.
  useEffect(() => {
    if (prefetchTimerRef.current) window.clearTimeout(prefetchTimerRef.current)
    const v = input.trim()
    if (!v || v === query) return
    prefetchTimerRef.current = window.setTimeout(() => {
      h.search.start(v, true).catch(() => {})
    }, 150)
    return () => {
      if (prefetchTimerRef.current) window.clearTimeout(prefetchTimerRef.current)
    }
  }, [input, query])

  function openExternal(url: string) {
    if (activeTabId) h.tabs.navigate(activeTabId, url)
  }
  function openMaps() {
    if (activeTabId) h.tabs.navigate(activeTabId, 'https://www.openstreetmap.org/search?query=' + encodeURIComponent(query))
  }

  function open(url: string) {
    if (activeTabId) h.tabs.navigate(activeTabId, url)
  }
  function submit(e: React.FormEvent) {
    e.preventDefault()
    const q = input.trim()
    if (!q || !activeTabId) return
    h.tabs.navigate(activeTabId, q)
  }
  function hostOf(u: string): string {
    try { return new URL(u).hostname.replace(/^www\./, '') } catch { return u }
  }
  function pathOf(u: string): string {
    try {
      const p = new URL(u)
      const segs = p.pathname.split('/').filter(Boolean)
      return segs.length ? ' › ' + segs.join(' › ') : ''
    } catch { return '' }
  }

  return (
    <div style={{
      width: '100%', height: '100%', overflowY: 'auto',
      background: '#fff', color: '#202124',
      fontFamily: 'arial, sans-serif'
    }}>
      <header style={{
        borderBottom: '1px solid #ebebeb',
        padding: '20px 30px 0 30px',
        display: 'flex', alignItems: 'flex-start', gap: 30
      }}>
        <div
          onClick={() => activeTabId && h.tabs.navigate(activeTabId, 'about:newtab')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', paddingTop: 8 }}
        >
          <img src={logoUrl} width={28} height={28} alt="" />
          <span style={{ fontSize: 22, fontWeight: 500, color: '#ff4500', letterSpacing: '-0.5px' }}>Helios</span>
        </div>
        <form onSubmit={submit} style={{ flex: 1, maxWidth: 690 }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            border: '1px solid #dfe1e5', borderRadius: 24,
            padding: '6px 14px', boxShadow: '0 1px 6px rgba(32,33,36,0.08)',
            background: '#fff'
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
              style={{
                flex: 1, border: 'none', outline: 'none', fontSize: 16,
                background: 'transparent', color: '#202124', padding: '6px 8px'
              }}
            />
            <SearchIcon />
          </div>
        </form>
      </header>

      <nav style={{
        padding: '0 30px', borderBottom: '1px solid #ebebeb',
        display: 'flex', gap: 24, fontSize: 13, color: '#5f6368', position: 'relative'
      }}>
        <Tab active>All</Tab>
        <Tab onClick={() => openExternal('https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(query))}>Images</Tab>
        <Tab onClick={() => openExternal('https://www.google.com/search?tbm=nws&q=' + encodeURIComponent(query))}>News</Tab>
        <Tab onClick={() => openExternal('https://www.google.com/search?tbm=vid&q=' + encodeURIComponent(query))}>Videos</Tab>
        <Tab onClick={openMaps}>Maps</Tab>
        <MoreMenu query={query} open={open} />
      </nav>

      <div style={{ padding: '12px 30px 0 152px', fontSize: 12, color: '#70757a', display: 'flex', alignItems: 'center', gap: 10 }}>
        {(state.status === 'done' || state.status === 'streaming') && state.results.length > 0 && (
          <>
            <span>About {state.results.length} results{state.elapsed ? ` (${state.elapsed.toFixed(2)} seconds)` : ''}</span>
            {state.status === 'streaming' && (
              <span style={{ color: '#1a73e8', fontStyle: 'italic' }}>· Refining…</span>
            )}
          </>
        )}
      </div>

      <div style={{
        display: 'flex', gap: 60, padding: '14px 30px 60px 152px',
        maxWidth: 1200
      }}>
        <main style={{ flex: '1 1 0', minWidth: 0, maxWidth: 652 }}>
          {state.status === 'loading' && <Skeleton />}
          {state.status === 'error' && <ErrorPanel reason={state.reason} query={query} />}
          {state.status === 'done' && state.results.length === 0 && (
            <div style={{ color: '#70757a', fontSize: 14, padding: '20px 0' }}>
              No results found for <b>{query}</b>.
            </div>
          )}
          {(state.status === 'done' || state.status === 'streaming') && state.results.map((r, i) => (
            <article key={canon(r.url)} style={{ marginBottom: 28, animation: i < 5 ? `fadeIn 0.18s ${i * 0.02}s both` : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                {r.favicon
                  ? <img src={r.favicon} width={18} height={18} style={{ borderRadius: 50, background: '#f1f3f4', padding: 2 }} onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden' }} />
                  : <span style={{ width: 22, height: 22, background: '#f1f3f4', borderRadius: 50 }} />}
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <span style={{ fontSize: 14, color: '#202124' }}>{hostOf(r.url)}</span>
                  <span style={{ fontSize: 12, color: '#5f6368' }}>
                    {hostOf(r.url)}{pathOf(r.url)}
                  </span>
                </div>
              </div>
              <h3
                onClick={() => open(r.url)}
                className="helios-g-title"
                style={{
                  fontSize: 20, fontWeight: 400, color: '#1a0dab',
                  margin: '4px 0 4px 0', cursor: 'pointer', lineHeight: 1.3
                }}
              >
                {r.title}
              </h3>
              <div
                style={{ fontSize: 14, color: '#4d5156', lineHeight: 1.58 }}
                dangerouslySetInnerHTML={{ __html: sanitize(r.description) }}
              />
            </article>
          ))}
        </main>

        {state.card && (
          <aside style={{
            flex: '0 0 320px',
            border: '1px solid #dadce0', borderRadius: 8,
            padding: 20, height: 'fit-content', background: '#fff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}>
            {state.card.thumbnail && (
              <img src={state.card.thumbnail} style={{ width: '100%', borderRadius: 4, marginBottom: 12 }} alt="" />
            )}
            <div style={{ fontSize: 22, fontWeight: 400, color: '#202124', marginBottom: 8 }}>
              {state.card.title}
            </div>
            <div style={{ fontSize: 14, color: '#5f6368', lineHeight: 1.5, marginBottom: 12 }}>
              {state.card.description}
            </div>
            {state.card.url && (
              <a
                onClick={(e) => { e.preventDefault(); state.card?.url && open(state.card.url) }}
                href={state.card.url}
                style={{ fontSize: 13, color: '#1a73e8', cursor: 'pointer', textDecoration: 'none' }}
              >
                Wikipedia →
              </a>
            )}
          </aside>
        )}
      </div>

      <style>{`
        .helios-g-title:hover { text-decoration: underline; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  )
}

function Tab({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{
      padding: '14px 0',
      borderBottom: active ? '3px solid #ff4500' : '3px solid transparent',
      color: active ? '#ff4500' : '#5f6368',
      cursor: 'pointer', fontSize: 13, fontWeight: active ? 500 : 400,
      userSelect: 'none'
    }}>{children}</div>
  )
}

function MoreMenu({ query, open }: { query: string; open: (url: string) => void }) {
  const [show, setShow] = useState(false)
  const items: Array<[string, string]> = [
    ['Books',     'https://www.google.com/search?tbm=bks&q=' + encodeURIComponent(query)],
    ['Shopping',  'https://www.google.com/search?tbm=shop&q=' + encodeURIComponent(query)],
    ['Scholar',   'https://scholar.google.com/scholar?q=' + encodeURIComponent(query)],
    ['Translate', 'https://translate.google.com/?text=' + encodeURIComponent(query)],
    ['Wikipedia', 'https://en.wikipedia.org/wiki/Special:Search?search=' + encodeURIComponent(query)]
  ]
  return (
    <div style={{ position: 'relative' }} onMouseLeave={() => setShow(false)}>
      <Tab onClick={() => setShow((s) => !s)}>More ▾</Tab>
      {show && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 10,
          background: '#fff', border: '1px solid #dadce0', borderRadius: 6,
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)', minWidth: 160, padding: '6px 0'
        }}>
          {items.map(([label, url]) => (
            <div
              key={label}
              onClick={() => { setShow(false); open(url) }}
              style={{ padding: '8px 16px', fontSize: 13, color: '#202124', cursor: 'pointer' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f1f3f4' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >{label}</div>
          ))}
        </div>
      )}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth={2}>
      <circle cx={11} cy={11} r={7} />
      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
    </svg>
  )
}

function Skeleton() {
  return (
    <div>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{ marginBottom: 28, opacity: 0.7 }}>
          <div style={{ height: 14, width: '30%', background: '#f1f3f4', borderRadius: 4, marginBottom: 8 }} />
          <div style={{ height: 20, width: '70%', background: '#e8eaed', borderRadius: 4, marginBottom: 8 }} />
          <div style={{ height: 12, width: '95%', background: '#f1f3f4', borderRadius: 4, marginBottom: 4 }} />
          <div style={{ height: 12, width: '85%', background: '#f1f3f4', borderRadius: 4 }} />
        </div>
      ))}
    </div>
  )
}

function ErrorPanel({ reason, query: _query }: { reason?: string; query: string }) {
  let title = 'Search is unavailable.'
  let body = 'Please try again in a moment.'
  if (reason === 'empty_query') { title = 'Type something to search.'; body = '' }
  else if (reason === 'all_providers_failed') { title = 'No results.'; body = 'The search service could not be reached. Check your network and try again.' }
  else if (reason === 'timeout') { title = 'Search timed out.'; body = 'Try again in a moment.' }
  else if (reason === 'network') { title = 'Could not reach the search service.'; body = 'Check your network connection.' }
  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ fontSize: 18, color: '#202124', marginBottom: 6 }}>{title}</div>
      {body && <div style={{ fontSize: 14, color: '#5f6368' }}>{body}</div>}
    </div>
  )
}

function sanitize(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/on\w+="[^"]*"/gi, '')
}
