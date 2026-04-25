import { useState, useEffect, useMemo } from 'react'
import { useBrowserStore } from '../../store/browserStore'
import type { Settings } from '../../types'
import { THEMES } from './themes'

type CategoryId =
  | 'general' | 'appearance' | 'search' | 'profile' | 'privacy'
  | 'autofill' | 'notifications' | 'permissions' | 'performance'
  | 'extensions' | 'system' | 'downloads' | 'advanced' | 'about'

const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'general',       label: 'General' },
  { id: 'appearance',    label: 'Appearance' },
  { id: 'search',        label: 'Search engine' },
  { id: 'profile',       label: 'You and Google' },
  { id: 'privacy',       label: 'Privacy and security' },
  { id: 'autofill',      label: 'Autofill and passwords' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'permissions',   label: 'Site permissions' },
  { id: 'performance',   label: 'Performance' },
  { id: 'extensions',    label: 'Extensions' },
  { id: 'system',        label: 'System' },
  { id: 'downloads',     label: 'Downloads' },
  { id: 'advanced',      label: 'Advanced' },
  { id: 'about',         label: 'About' }
]

export function SettingsPage() {
  const { settings, setSettings, setSettingsOpen, user } = useBrowserStore()
  const [local, setLocal] = useState<Settings | null>(settings)
  const [category, setCategory] = useState<CategoryId>('general')
  const [query, setQuery] = useState('')
  const h = window.helios

  useEffect(() => { setLocal(settings) }, [settings])

  async function change<K extends keyof Settings>(key: K, value: Settings[K]) {
    if (!local) return
    await h.settings.set(key as string, value)
    const updated = { ...local, [key]: value }
    setLocal(updated)
    setSettings(updated)
  }

  async function resetAll() {
    if (!confirm('Reset all settings to their defaults?')) return
    const fresh = await h.settings.reset()
    setLocal(fresh)
    setSettings(fresh)
  }

  async function clearBrowsing() {
    if (!confirm('Clear browsing history, cookies, and cached files?')) return
    await h.data.clearBrowsing()
    alert('Browsing data cleared.')
  }

  const filtered = useMemo(() => {
    if (!query.trim()) return CATEGORIES
    const q = query.toLowerCase()
    return CATEGORIES.filter(c => c.label.toLowerCase().includes(q))
  }, [query])

  if (!local) return null

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'var(--bg-0)', zIndex: 30,
      display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.18s ease'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderBottom: '1px solid var(--border-0)', background: 'var(--bg-1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 600 }}>Settings</span>
          <input
            placeholder="Search settings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ height: 28, width: 260, fontSize: 12 }}
          />
        </div>
        <button
          onClick={() => setSettingsOpen(false)}
          style={{ padding: '6px 14px', background: 'var(--bg-3)', borderRadius: 'var(--radius-md)', fontSize: 12 }}
        >
          Close
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside style={{
          width: 240, flexShrink: 0, background: 'var(--bg-1)',
          borderRight: '1px solid var(--border-0)', overflowY: 'auto', padding: '8px 0'
        }}>
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 20px', justifyContent: 'flex-start',
                background: category === c.id ? 'var(--accent-dim)' : 'transparent',
                color: category === c.id ? 'var(--accent)' : 'var(--text-0)',
                borderRadius: 0, fontSize: 13, fontWeight: category === c.id ? 500 : 400
              }}
            >
              <span>{c.label}</span>
            </button>
          ))}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-0)', marginTop: 8 }}>
            <button onClick={resetAll} style={{ fontSize: 12, color: 'var(--danger)', padding: '6px 0' }}>
              Reset all settings
            </button>
          </div>
        </aside>

        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          {category === 'general'       && <GeneralSection       s={local} on={change} />}
          {category === 'appearance'    && <AppearanceSection    s={local} on={change} />}
          {category === 'search'        && <SearchSection        s={local} on={change} />}
          {category === 'profile'       && <ProfileSection       s={local} on={change} user={user} />}
          {category === 'privacy'       && <PrivacySection       s={local} on={change} onClear={clearBrowsing} />}
          {category === 'autofill'      && <AutofillSection      s={local} on={change} />}
          {category === 'notifications' && <NotificationsSection s={local} on={change} />}
          {category === 'permissions'   && <PermissionsSection   s={local} on={change} />}
          {category === 'performance'   && <PerformanceSection   s={local} on={change} />}
          {category === 'extensions'    && <ExtensionsSection    s={local} on={change} />}
          {category === 'system'        && <SystemSection        s={local} on={change} />}
          {category === 'downloads'     && <DownloadsSection     s={local} on={change} />}
          {category === 'advanced'      && <AdvancedSection      s={local} on={change} />}
          {category === 'about'         && <AboutSection />}
        </main>
      </div>
    </div>
  )
}

// ── sections ───────────────────────────────────────────────────────────────

type OnChange = <K extends keyof Settings>(k: K, v: Settings[K]) => void

function GeneralSection({ s, on }: { s: Settings; on: OnChange }) {
  return (
    <Section title="General">
      <Group title="Startup">
        <Row label="On launch">
          <Select value={s.startup_mode} onChange={(v) => on('startup_mode', v as any)}
            options={[['newtab', 'Open new tab'], ['continue', 'Continue where you left off'], ['homepage', 'Open homepage']]} />
        </Row>
        <Row label="Homepage URL">
          <Text value={s.homepage_url} onChange={(v) => on('homepage_url', v)} placeholder="https://..." />
        </Row>
        <Row label="Restore session on startup">
          <Toggle checked={s.restore_session} onChange={(v) => on('restore_session', v)} />
        </Row>
      </Group>
      <Group title="Default browser">
        <Row label="Make Helios your default browser">
          <button
            onClick={() => window.helios?.system?.openDefaultAppsSettings()}
            style={{ padding: '6px 14px', background: 'var(--accent)', color: '#fff', borderRadius: 4, fontSize: 12, fontWeight: 500 }}
          >
            Make default
          </button>
        </Row>
      </Group>
      <Group title="Language">
        <Row label="Display language">
          <Select value={s.language} onChange={(v) => on('language', v)}
            options={[['en-US','English (US)'],['en-GB','English (UK)'],['es-ES','Spanish'],['fr-FR','French'],['de-DE','German'],['ja-JP','Japanese'],['he-IL','Hebrew'],['pt-BR','Portuguese'],['it-IT','Italian'],['zh-CN','Chinese (Simplified)']]} />
        </Row>
      </Group>
    </Section>
  )
}

function AppearanceSection({ s, on }: { s: Settings; on: OnChange }) {
  const themeEntries = Object.entries(THEMES) as [string, { label: string; vars: any }][]
  return (
    <Section title="Appearance">
      <Group title="Theme">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, padding: 12 }}>
          {themeEntries.map(([id, t]) => (
            <button
              key={id}
              onClick={() => on('theme', id as any)}
              style={{
                padding: 10, borderRadius: 8, border: `2px solid ${s.theme === id ? 'var(--accent)' : 'transparent'}`,
                background: t.vars['--bg-1'], color: t.vars['--text-0'],
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', gap: 4 }}>
                {['--bg-0','--bg-2','--accent','--text-0'].map(k => (
                  <div key={k} style={{ width: 16, height: 16, borderRadius: 4, background: (t.vars as any)[k] }} />
                ))}
              </div>
              <span style={{ fontSize: 12, fontWeight: 500 }}>{t.label}</span>
            </button>
          ))}
        </div>
      </Group>
      <Group title="Colors">
        <Row label="Accent color">
          <input type="color" value={s.accent_color}
            onChange={(e) => on('accent_color', e.target.value)}
            style={{ width: 40, height: 24, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }} />
        </Row>
      </Group>
      <Group title="Fonts">
        <Row label="Font family">
          <Select value={s.font_family} onChange={(v) => on('font_family', v)}
            options={[['system','System Default'],['sans','Sans Serif'],['serif','Serif'],['mono','Monospace'],['rounded','Rounded']]} />
        </Row>
        <Row label={`Font size (${s.font_size}px)`}>
          <input type="range" min={10} max={20} value={s.font_size}
            onChange={(e) => on('font_size', Number(e.target.value))} style={{ width: 160 }} />
        </Row>
      </Group>
      <Group title="UI Layout">
        <Row label="Tab style">
          <Select value={s.tab_style} onChange={(v) => on('tab_style', v as any)}
            options={[['rounded','Rounded'],['square','Square'],['pill','Pill']]} />
        </Row>
        <Row label="Compact UI">
          <Toggle checked={s.compact_ui} onChange={(v) => on('compact_ui', v)} />
        </Row>
        <Row label="Show bookmarks bar">
          <Toggle checked={s.show_bookmarks_bar} onChange={(v) => on('show_bookmarks_bar', v)} />
        </Row>
        <Row label="Auto-hide sidebar">
          <Toggle checked={s.sidebar_autohide} onChange={(v) => on('sidebar_autohide', v)} />
        </Row>
      </Group>
    </Section>
  )
}

function SearchSection({ s, on }: { s: Settings; on: OnChange }) {
  return (
    <Section title="Search">
      <Group title="Search engine">
        <Row label="Default engine">
          <Select value={s.search_engine} onChange={(v) => on('search_engine', v)}
            options={[
              ['https://www.google.com/search?q={query}','Google'],
              ['https://www.bing.com/search?q={query}','Bing'],
              ['https://duckduckgo.com/?q={query}','DuckDuckGo'],
              ['https://search.brave.com/search?q={query}','Brave Search'],
              ['https://www.ecosia.org/search?q={query}','Ecosia'],
              ['https://www.startpage.com/do/search?q={query}','Startpage'],
              ['https://kagi.com/search?q={query}','Kagi']
            ]} />
        </Row>
      </Group>
      <Group title="Address bar">
        <Row label="Show search suggestions">
          <Toggle checked={s.search_suggestions} onChange={(v) => on('search_suggestions', v)} />
        </Row>
        <Row label="Suggest pages from history">
          <Toggle checked={s.address_bar_history} onChange={(v) => on('address_bar_history', v)} />
        </Row>
        <Row label="Autocomplete URLs">
          <Toggle checked={s.autocomplete} onChange={(v) => on('autocomplete', v)} />
        </Row>
      </Group>
    </Section>
  )
}

function ProfileSection({ s, on, user }: { s: Settings; on: OnChange; user: any }) {
  return (
    <Section title="Profile">
      <Group title="Account">
        <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          {user?.picture && <img src={user.picture} alt="" style={{ width: 48, height: 48, borderRadius: '50%' }} />}
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{user?.name ?? 'Not signed in'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-1)' }}>{user?.email ?? 'Sign in to sync your data'}</div>
          </div>
        </div>
        <Row label="Sync enabled">
          <Toggle checked={s.sync_enabled} onChange={(v) => on('sync_enabled', v)} />
        </Row>
      </Group>
      <Group title="Import">
        <Row label="Import bookmarks & history">
          <button style={{ padding: '4px 12px', background: 'var(--bg-3)', borderRadius: 4, fontSize: 12 }}>Import…</button>
        </Row>
      </Group>
    </Section>
  )
}

function PrivacySection({ s, on, onClear }: { s: Settings; on: OnChange; onClear: () => void }) {
  return (
    <Section title="Privacy & Security">
      <Group title="Tracking protection">
        <Row label="Level">
          <Select value={s.tracking_protection} onChange={(v) => on('tracking_protection', v as any)}
            options={[['standard','Standard'],['strict','Strict'],['off','Off']]} />
        </Row>
        <Row label="Send 'Do Not Track' request">
          <Toggle checked={s.do_not_track} onChange={(v) => on('do_not_track', v)} />
        </Row>
      </Group>
      <Group title="Cookies">
        <Row label="Block third-party cookies">
          <Toggle checked={s.block_third_party_cookies} onChange={(v) => on('block_third_party_cookies', v)} />
        </Row>
      </Group>
      <Group title="HTTPS">
        <Row label="Always use HTTPS when possible">
          <Toggle checked={s.https_only} onChange={(v) => on('https_only', v)} />
        </Row>
        <Row label="Safe browsing protection">
          <Toggle checked={s.safe_browsing} onChange={(v) => on('safe_browsing', v)} />
        </Row>
      </Group>
      <Group title="Clear data">
        <Row label="Clear browsing history, cache, and cookies">
          <button onClick={onClear} style={{ padding: '4px 12px', background: 'var(--danger)', color: '#fff', borderRadius: 4, fontSize: 12 }}>Clear now</button>
        </Row>
      </Group>
    </Section>
  )
}

function AutofillSection({ s, on }: { s: Settings; on: OnChange }) {
  return (
    <Section title="Autofill & Passwords">
      <Group title="Passwords">
        <Row label="Offer to save passwords">
          <Toggle checked={s.save_passwords} onChange={(v) => on('save_passwords', v)} />
        </Row>
        <Row label="Saved logins"><span style={{ color: 'var(--text-1)', fontSize: 12 }}>No saved logins</span></Row>
      </Group>
      <Group title="Payment methods">
        <Row label="Autofill payment methods">
          <Toggle checked={s.autofill_payments} onChange={(v) => on('autofill_payments', v)} />
        </Row>
      </Group>
      <Group title="Addresses">
        <Row label="Autofill addresses">
          <Toggle checked={s.autofill_addresses} onChange={(v) => on('autofill_addresses', v)} />
        </Row>
      </Group>
    </Section>
  )
}

function NotificationsSection({ s, on }: { s: Settings; on: OnChange }) {
  return (
    <Section title="Notifications">
      <Group title="Site notifications">
        <Row label="Allow sites to show notifications">
          <Toggle checked={s.notifications_enabled} onChange={(v) => on('notifications_enabled', v)} />
        </Row>
        <Row label="Play sound for notifications">
          <Toggle checked={s.notification_sound} onChange={(v) => on('notification_sound', v)} />
        </Row>
      </Group>
    </Section>
  )
}

function PermissionsSection({ s, on }: { s: Settings; on: OnChange }) {
  const perm = (k: any) => (
    <Select value={(s as any)[k]} onChange={(v) => on(k, v as any)}
      options={k === 'perm_popups' || k === 'perm_ads'
        ? [['allow','Allow'],['block','Block']]
        : [['ask','Ask each time'],['block','Block']]} />
  )
  return (
    <Section title="Site Permissions">
      <Group title="Defaults">
        <Row label="Camera">{perm('perm_camera')}</Row>
        <Row label="Microphone">{perm('perm_microphone')}</Row>
        <Row label="Location">{perm('perm_location')}</Row>
        <Row label="Pop-ups and redirects">{perm('perm_popups')}</Row>
        <Row label="Intrusive ads">{perm('perm_ads')}</Row>
      </Group>
    </Section>
  )
}

function PerformanceSection({ s, on }: { s: Settings; on: OnChange }) {
  return (
    <Section title="Performance">
      <Group title="Memory">
        <Row label="Memory saver">
          <Toggle checked={s.memory_saver} onChange={(v) => on('memory_saver', v)} />
        </Row>
        <Row label="Preload pages for faster browsing">
          <Toggle checked={s.preload_pages} onChange={(v) => on('preload_pages', v)} />
        </Row>
      </Group>
      <Group title="System">
        <Row label="Use hardware acceleration when available">
          <Toggle checked={s.hardware_acceleration} onChange={(v) => on('hardware_acceleration', v)} />
        </Row>
        <Row label="Continue running background apps when closed">
          <Toggle checked={s.background_apps} onChange={(v) => on('background_apps', v)} />
        </Row>
      </Group>
    </Section>
  )
}

function ExtensionsSection({ s, on }: { s: Settings; on: OnChange }) {
  return (
    <Section title="Extensions">
      <Group title="Extensions">
        <Row label="Enable extensions">
          <Toggle checked={s.extensions_enabled} onChange={(v) => on('extensions_enabled', v)} />
        </Row>
        <Row label="Allow Extension Store access">
          <Toggle checked={s.allow_extension_store} onChange={(v) => on('allow_extension_store', v)} />
        </Row>
        <Row label="Installed"><span style={{ color: 'var(--text-1)', fontSize: 12 }}>None installed</span></Row>
      </Group>
    </Section>
  )
}

function SystemSection({ s, on }: { s: Settings; on: OnChange }) {
  return (
    <Section title="System & Behavior">
      <Group title="Tabs">
        <Row label="When closing active tab, go to">
          <Select value={s.tab_close_behavior} onChange={(v) => on('tab_close_behavior', v as any)}
            options={[['last-active','Last active tab'],['left','Tab to the left'],['right','Tab to the right'],['newtab','Open new tab']]} />
        </Row>
        <Row label="Confirm before closing multiple tabs">
          <Toggle checked={s.confirm_close_multiple} onChange={(v) => on('confirm_close_multiple', v)} />
        </Row>
      </Group>
      <Group title="Interaction">
        <Row label="Enable mouse gestures">
          <Toggle checked={s.mouse_gestures} onChange={(v) => on('mouse_gestures', v)} />
        </Row>
        <Row label="Smooth scrolling">
          <Toggle checked={s.smooth_scroll} onChange={(v) => on('smooth_scroll', v)} />
        </Row>
        <Row label="Gaming mode (disable background throttling)">
          <Toggle checked={s.gaming_mode} onChange={(v) => on('gaming_mode', v)} />
        </Row>
      </Group>
      <Group title="Shortcuts">
        <Row label="New tab">
          <code style={{ fontSize: 11, color: 'var(--text-1)' }}>Ctrl+T</code>
        </Row>
        <Row label="Close tab">
          <code style={{ fontSize: 11, color: 'var(--text-1)' }}>Ctrl+W</code>
        </Row>
        <Row label="Reload">
          <code style={{ fontSize: 11, color: 'var(--text-1)' }}>Ctrl+R</code>
        </Row>
        <Row label="Focus address bar">
          <code style={{ fontSize: 11, color: 'var(--text-1)' }}>Ctrl+L</code>
        </Row>
      </Group>
    </Section>
  )
}

function DownloadsSection({ s, on }: { s: Settings; on: OnChange }) {
  return (
    <Section title="Downloads">
      <Group title="Location">
        <Row label="Download folder">
          <Text value={s.download_path} onChange={(v) => on('download_path', v)} placeholder="C:\\Users\\..." />
        </Row>
        <Row label="Ask where to save each file before downloading">
          <Toggle checked={s.ask_download_location} onChange={(v) => on('ask_download_location', v)} />
        </Row>
      </Group>
      <Group title="Behavior">
        <Row label="Open PDFs in system viewer">
          <Toggle checked={s.open_pdfs_externally} onChange={(v) => on('open_pdfs_externally', v)} />
        </Row>
      </Group>
    </Section>
  )
}

function AdvancedSection({ s, on }: { s: Settings; on: OnChange }) {
  return (
    <Section title="Advanced / Developer">
      <Group title="Experimental">
        <Row label="Enable experimental features">
          <Toggle checked={s.experimental_features} onChange={(v) => on('experimental_features', v)} />
        </Row>
        <Row label="Enable chrome://flags style toggles">
          <Toggle checked={s.flags_enabled} onChange={(v) => on('flags_enabled', v)} />
        </Row>
      </Group>
      <Group title="Developer">
        <Row label="Enable DevTools">
          <Toggle checked={s.devtools_enabled} onChange={(v) => on('devtools_enabled', v)} />
        </Row>
        <Row label="User-Agent override">
          <Text value={s.user_agent_override} onChange={(v) => on('user_agent_override', v)} placeholder="(default)" />
        </Row>
      </Group>
    </Section>
  )
}

function AboutSection() {
  const h = (window as any).helios
  const [version, setVersion] = useState<string>('0.1.0')
  const [status, setStatus] = useState<string>('')
  const [percent, setPercent] = useState<number | null>(null)
  const [readyToInstall, setReadyToInstall] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    h.updates?.getVersion().then((v: string) => setVersion(v)).catch(() => {})
    const unsub = h.updates?.onStatus(({ event, data }: any) => {
      switch (event) {
        case 'checking':      setStatus('Checking for updates...'); setPercent(null); break
        case 'available':     setStatus(`Update available: v${data.version}`); setUpdateAvailable(data.version); break
        case 'not-available': setStatus(`You're up to date (v${data.version}).`); setUpdateAvailable(null); break
        case 'progress':      setStatus(`Downloading... ${data.percent}%`); setPercent(data.percent); break
        case 'downloaded':    setStatus(`Update v${data.version} downloaded.`); setReadyToInstall(true); setPercent(100); break
        case 'error':         setStatus(`Update error: ${data.message}`); setBusy(false); break
      }
    })
    return () => { unsub?.() }
  }, [])

  async function check() {
    setBusy(true); setStatus('Checking for updates...'); setReadyToInstall(false); setPercent(null)
    const r = await h.updates.check()
    if (!r.ok) {
      if (r.reason === 'dev') setStatus('Updates only work in the packaged build, not dev mode.')
      else setStatus(`Couldn't check: ${r.reason}`)
      setBusy(false)
    }
  }
  async function download() {
    setBusy(true); setStatus('Starting download...')
    const r = await h.updates.download()
    if (!r.ok) { setStatus(`Download failed: ${r.reason}`); setBusy(false) }
  }
  function install() { h.updates.install() }

  return (
    <Section title="About Helios">
      <Group title="Version">
        <Row label="Helios Browser"><span style={{ fontSize: 12, color: 'var(--text-1)' }}>{version}</span></Row>
        <Row label="Electron runtime"><span style={{ fontSize: 12, color: 'var(--text-1)' }}>latest</span></Row>
      </Group>
      <Group title="Updates">
        <Row label="Check for updates">
          {readyToInstall ? (
            <button onClick={install} style={{ padding: '6px 14px', background: 'var(--accent)', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>
              Restart & install
            </button>
          ) : updateAvailable ? (
            <button onClick={download} disabled={busy} style={{ padding: '6px 14px', background: 'var(--accent)', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 500, opacity: busy ? 0.6 : 1 }}>
              Download v{updateAvailable}
            </button>
          ) : (
            <button onClick={check} disabled={busy} style={{ padding: '6px 14px', background: 'var(--bg-3)', borderRadius: 6, fontSize: 12, opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Checking...' : 'Check'}
            </button>
          )}
        </Row>
        {status && (
          <Row label="Status">
            <span style={{ fontSize: 12, color: 'var(--text-1)' }}>{status}</span>
          </Row>
        )}
        {percent !== null && percent < 100 && (
          <Row label="Progress">
            <div style={{ width: 200, height: 6, background: 'var(--bg-3)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${percent}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.2s' }} />
            </div>
          </Row>
        )}
      </Group>
    </Section>
  )
}

// ── primitives ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 760 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 20 }}>{title}</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>{children}</div>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{title}</p>
      <div style={{ background: 'var(--bg-1)', borderRadius: 8, border: '1px solid var(--border-0)', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', borderBottom: '1px solid var(--border-0)', gap: 16, minHeight: 48
    }}>
      <span style={{ fontSize: 13, color: 'var(--text-0)' }}>{label}</span>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      width: 36, height: 20, borderRadius: 10,
      background: checked ? 'var(--accent)' : 'var(--bg-3)',
      border: `1px solid ${checked ? 'var(--accent)' : 'var(--border-2)'}`,
      position: 'relative', cursor: 'pointer', transition: 'all 0.18s'
    }}>
      <div style={{
        position: 'absolute', top: 2, left: checked ? 16 : 2,
        width: 14, height: 14, borderRadius: '50%',
        background: checked ? '#fff' : 'var(--text-2)',
        transition: 'left 0.18s cubic-bezier(0.34,1.56,0.64,1)'
      }} />
    </div>
  )
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{ minWidth: 180, fontSize: 12 }}>
      {options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
    </select>
  )
}

function Text({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: 280, height: 28, fontSize: 12 }} />
  )
}
