import { useState } from 'react'
import type { Note } from '../types'

type Props = {
  notes: Note[]
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function NotesView({ notes, setNotes }: Props) {
  const [draft, setDraft] = useState('')

  function addNote() {
    const text = draft.trim()
    if (!text) return
    setNotes((prev) => [
      { id: crypto.randomUUID(), text, updatedAt: Date.now() },
      ...prev,
    ])
    setDraft('')
  }

  function removeNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <section className="view">
      <header className="view-header">
        <h1>Notes</h1>
        <p className="subtitle">
          {notes.length === 0
            ? 'Jot anything down.'
            : `${notes.length} note${notes.length === 1 ? '' : 's'}`}
        </p>
      </header>

      <form
        className="composer composer-column"
        onSubmit={(e) => {
          e.preventDefault()
          addNote()
        }}
      >
        <textarea
          className="composer-input composer-textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a note…"
          aria-label="New note"
          rows={3}
        />
        <button className="composer-btn-wide" type="submit">
          Add note
        </button>
      </form>

      <ul className="list">
        {notes.length === 0 && (
          <li className="empty">Your notes will appear here.</li>
        )}
        {notes.map((note) => (
          <li key={note.id} className="note">
            <div className="note-body">
              <p className="note-text">{note.text}</p>
              <time className="note-time">{formatDate(note.updatedAt)}</time>
            </div>
            <button
              className="icon-btn"
              onClick={() => removeNote(note.id)}
              aria-label="Delete note"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
