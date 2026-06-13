import { useState } from 'react'
import type { Note } from '../types'
import { formatTimestamp } from '../lib/date'

type Props = {
  note: Note
  onDelete: (id: string) => void
  onUpdate: (id: string, patch: Partial<Note>) => void
}

export function NoteItem({ note, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(note.text)

  function save() {
    const trimmed = text.trim()
    if (!trimmed) return
    onUpdate(note.id, { text: trimmed, updatedAt: Date.now() })
    setEditing(false)
  }

  if (editing) {
    return (
      <li className="note editing">
        <form
          className="edit-form"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <textarea
            className="composer-input composer-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Edit note"
            rows={3}
            autoFocus
          />
          <div className="edit-actions">
            <button
              type="button"
              className="text-btn"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
            <button type="submit" className="text-btn primary">
              Save
            </button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li className={`note ${note.pinned ? 'pinned' : ''}`}>
      <div className="note-body">
        <p className="note-text">{note.text}</p>
        <time className="note-time">{formatTimestamp(note.updatedAt)}</time>
      </div>
      <button
        className={`icon-btn ${note.pinned ? 'active' : ''}`}
        onClick={() => onUpdate(note.id, { pinned: !note.pinned })}
        aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
        title={note.pinned ? 'Unpin' : 'Pin'}
      >
        {note.pinned ? '★' : '☆'}
      </button>
      <button
        className="icon-btn"
        onClick={() => setEditing(true)}
        aria-label="Edit note"
      >
        ✎
      </button>
      <button
        className="icon-btn"
        onClick={() => onDelete(note.id)}
        aria-label="Delete note"
      >
        ×
      </button>
    </li>
  )
}
