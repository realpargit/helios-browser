import { useBrowserStore } from '../../store/browserStore'
import type { Download } from '../../types'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

export function DownloadsPanel() {
  const { downloads, setDownloads } = useBrowserStore()
  const h = window.helios

  async function handleClear() {
    await h.downloads.clear()
    setDownloads(downloads.filter((d) => d.state === 'progressing'))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--border-0)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Downloads</span>
        <button onClick={handleClear} style={{ fontSize: 11, color: 'var(--text-2)', padding: '2px 6px', borderRadius: 3 }}>Clear done</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {downloads.map((dl) => (
          <DownloadItem key={dl.id} dl={dl} />
        ))}
        {downloads.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-2)', fontSize: 12 }}>No downloads</div>
        )}
      </div>
    </div>
  )
}

function DownloadItem({ dl }: { dl: Download }) {
  const h = window.helios
  const progress = dl.total_bytes > 0 ? (dl.received_bytes / dl.total_bytes) * 100 : 0

  const stateColor = {
    progressing: 'var(--accent)',
    completed: 'var(--success)',
    failed: 'var(--danger)',
    cancelled: 'var(--text-2)'
  }[dl.state]

  return (
    <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-0)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ flex: 1, fontSize: 12, color: 'var(--text-0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {dl.filename}
        </span>
        <span style={{ fontSize: 11, color: stateColor, flexShrink: 0 }}>
          {dl.state === 'progressing' ? `${progress.toFixed(0)}%` : dl.state}
        </span>
      </div>
      {dl.state === 'progressing' && (
        <div style={{ height: 3, background: 'var(--bg-3)', borderRadius: 2, marginBottom: 4, overflow: 'hidden', position: 'relative' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.3s cubic-bezier(0,0,0.2,1)', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
              animation: 'shimmerBar 1.4s ease-in-out infinite'
            }} />
          </div>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--text-2)' }}>
          {formatBytes(dl.received_bytes)}
          {dl.total_bytes > 0 && ` / ${formatBytes(dl.total_bytes)}`}
        </span>
        {dl.state === 'completed' && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => h.downloads.openFile(dl.save_path)} style={{ fontSize: 11, color: 'var(--accent)', padding: '1px 6px', borderRadius: 3 }}>Open</button>
            <button onClick={() => h.downloads.showInFolder(dl.save_path)} style={{ fontSize: 11, color: 'var(--text-2)', padding: '1px 6px', borderRadius: 3 }}>Show</button>
          </div>
        )}
      </div>
    </div>
  )
}
