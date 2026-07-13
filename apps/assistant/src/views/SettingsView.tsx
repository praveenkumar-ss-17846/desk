import { useRef, useState } from 'react'
import type { Note, Task } from '../types'
import { useTheme } from '../lib/useTheme'
import { newSyncCode, syncEnabled } from '../lib/sync'
import { formatTimestamp } from '../lib/date'
import type { SyncStatus } from '../lib/useAutoSync'

type Props = {
  tasks: Task[]
  notes: Note[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>
  code: string
  setCode: React.Dispatch<React.SetStateAction<string>>
  sync: {
    status: SyncStatus
    lastSyncedAt: number | null
    syncNow: () => void
    enabled: boolean
  }
}

const STATUS_TEXT: Record<SyncStatus, string> = {
  off: 'Off',
  syncing: 'Syncing…',
  synced: 'Synced',
  error: 'Sync error — will retry',
}

export function SettingsView({
  tasks,
  notes,
  setTasks,
  setNotes,
  code,
  setCode,
  sync,
}: Props) {
  const { theme, toggle } = useTheme()
  const fileInput = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState('')
  const [copied, setCopied] = useState(false)

  function exportData() {
    const data = JSON.stringify({ version: 1, tasks, notes }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `assistant-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setStatus('Backup downloaded.')
  }

  async function importData(file: File) {
    try {
      const parsed = JSON.parse(await file.text())
      if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.notes)) {
        setStatus('That file does not look like a backup.')
        return
      }
      setTasks(parsed.tasks as Task[])
      setNotes(parsed.notes as Note[])
      setStatus(
        `Imported ${parsed.tasks.length} tasks and ${parsed.notes.length} notes.`,
      )
    } catch {
      setStatus('Could not read that file.')
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="view">
      <header className="view-header">
        <h1>Settings</h1>
        <p className="subtitle">Appearance, sync, and your data.</p>
      </header>

      <div className="setting-row">
        <div>
          <p className="setting-title">Theme</p>
          <p className="setting-desc">Currently {theme}.</p>
        </div>
        <button className="text-btn primary" onClick={toggle}>
          {theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
        </button>
      </div>

      {/* ---- Cloud sync (auto) ---- */}
      {syncEnabled && (
        <>
          <div className="setting-row">
            <div>
              <p className="setting-title">Cloud sync</p>
              <p className="setting-desc">
                {code
                  ? 'Changes sync automatically across devices sharing this code.'
                  : 'Sync your tasks and notes across devices automatically.'}
              </p>
            </div>
            {code && (
              <span className={`sync-pill sync-${sync.status}`}>
                {STATUS_TEXT[sync.status]}
              </span>
            )}
          </div>

          {!code ? (
            <button
              className="composer-btn-wide"
              onClick={() => setCode(newSyncCode())}
            >
              Turn on cloud sync
            </button>
          ) : (
            <>
              <label className="setting-desc" htmlFor="synccode">
                Your sync code (enter it on another device to link them):
              </label>
              <div className="composer-row" style={{ marginTop: 6 }}>
                <input
                  id="synccode"
                  className="composer-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value.trim())}
                  aria-label="Sync code"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button className="composer-btn-wide ghost" onClick={copyCode}>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="composer-row" style={{ marginTop: 10 }}>
                <button
                  className="composer-btn-wide"
                  onClick={sync.syncNow}
                  disabled={sync.status === 'syncing'}
                >
                  Sync now
                </button>
                <button
                  className="composer-btn-wide ghost"
                  onClick={() => setCode('')}
                >
                  Turn off
                </button>
              </div>
              {sync.lastSyncedAt && (
                <p className="setting-desc" style={{ marginTop: 8 }}>
                  Last synced {formatTimestamp(sync.lastSyncedAt)}.
                </p>
              )}
            </>
          )}
        </>
      )}

      {/* ---- File backup ---- */}
      <div className="setting-row">
        <div>
          <p className="setting-title">Backup file</p>
          <p className="setting-desc">
            Export everything to a file, or restore from one.
          </p>
        </div>
      </div>
      <div className="composer-row">
        <button className="composer-btn-wide" onClick={exportData}>
          Export
        </button>
        <button
          className="composer-btn-wide ghost"
          onClick={() => fileInput.current?.click()}
        >
          Import
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void importData(file)
            e.target.value = ''
          }}
        />
      </div>
      {status && <p className="setting-status">{status}</p>}
    </section>
  )
}
