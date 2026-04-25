import { useState, useRef, useEffect } from 'react'
import { useBrowserStore } from '../../store/browserStore'

export function UserMenu() {
  const { user, setUser } = useBrowserStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const h = window.helios

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  async function handleSignOut() {
    await h.auth.signOut()
    setUser(null)
    setOpen(false)
  }

  if (!user) {
    return (
      <button
        onClick={() => h.auth.signIn()}
        title="Sign in with Google"
        style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--bg-3)', border: '1px solid var(--border-1)',
          color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="8" cy="5.5" r="2.5" />
          <path d="M2.5 13.5c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" />
        </svg>
      </button>
    )
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        title={user.name}
        style={{ width: 32, height: 32, borderRadius: '50%', padding: 0, overflow: 'hidden', border: open ? '2px solid var(--accent)' : '2px solid transparent', transition: 'border-color 0.15s' }}
      >
        <img
          src={user.picture}
          width={32}
          height={32}
          style={{ display: 'block', borderRadius: '50%' }}
          referrerPolicy="no-referrer"
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          bottom: 40,
          left: 0,
          minWidth: 220,
          background: 'var(--bg-2)',
          border: '1px solid var(--border-1)',
          borderRadius: 8,
          padding: '12px 0 6px',
          boxShadow: 'var(--shadow-md)',
          zIndex: 1000,
          animation: 'popIn 0.18s cubic-bezier(0,0,0.2,1) both',
          transformOrigin: 'bottom left'
        }}>
          <div style={{ padding: '0 12px 10px', borderBottom: '1px solid var(--border-0)' }}>
            <p style={{ fontSize: 13, color: 'var(--text-0)', fontWeight: 500, lineHeight: 1.3 }}>{user.name}</p>
            <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{user.email}</p>
          </div>
          <div style={{ padding: '6px 6px 0' }}>
            <button
              onClick={handleSignOut}
              style={{
                width: '100%', padding: '7px 8px', textAlign: 'left', fontSize: 12,
                color: 'var(--danger)', borderRadius: 5, justifyContent: 'flex-start',
                gap: 8
              }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h3" />
                <path d="M8.5 9.5 12 6.5l-3.5-3" />
                <line x1="12" y1="6.5" x2="5" y2="6.5" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
