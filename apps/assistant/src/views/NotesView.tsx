import { useMemo, useState } from 'react'
import type { Note } from '../types'
import { patchItem, softDelete, visible } from '../lib/store'
import { NoteItem } from '../components/NoteItem'

type Props = {
  notes: Note[]
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>
}

// Pinned notes first, then most recently updated.
function sortNotes(a: Note, b: Note) {
  if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1
  return b.updatedAt - a.updatedAt
}

export function NotesView({ notes, setNotes }: Props) {
  const [draft, setDraft] = useState('')
  const items = useMemo(() => visible(notes), [notes])
  const sorted = useMemo(() => [...items].sort(sortNotes), [items])

  function addNote() {
    const text = draft.trim()
    if (!text) return
    setNotes((prev) => [
      { id: crypto.randomUUID(), text, updatedAt: Date.now() },
      ...prev,
    ])
    setDraft('')
  }

  const remove = (id: string) => setNotes((prev) => softDelete(prev, id))
  const update = (id: string, patch: Partial<Note>) =>
    setNotes((prev) => patchItem(prev, id, patch))

  return (
    <section className="view">
      <header className="view-header">
        <h1>Notes</h1>
        <p className="subtitle">
          {items.length === 0
            ? 'Jot anything down.'
            : `${items.length} note${items.length === 1 ? '' : 's'}`}
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
        {items.length === 0 && (
          <li className="empty">Your notes will appear here.</li>
        )}
        {sorted.map((note) => (
          <NoteItem
            key={note.id}
            note={note}
            onDelete={remove}
            onUpdate={update}
          />
        ))}
      </ul>
    </section>
  )
}
