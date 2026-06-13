import { useRef, useState } from 'react'
import type { Note, Task } from '../types'
import { useTheme } from '../lib/useTheme'

type Props = {
  tasks: Task[]
  notes: Note[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>
}

export function SettingsView({ tasks, notes, setTasks, setNotes }: Props) {
  const { theme, toggle } = useTheme()
  const fileInput = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState('')

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

  return (
    <section className="view">
      <header className="view-header">
        <h1>Settings</h1>
        <p className="subtitle">Appearance and your data.</p>
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

      <div className="setting-row">
        <div>
          <p className="setting-title">Backup</p>
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

      <p className="setting-footnote">
        {tasks.length} tasks · {notes.length} notes stored on this device.
      </p>
    </section>
  )
}
