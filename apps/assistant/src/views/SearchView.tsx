import { useMemo, useState } from 'react'
import type { Note, Task } from '../types'
import { TaskItem } from '../components/TaskItem'
import { NoteItem } from '../components/NoteItem'

type Props = {
  tasks: Task[]
  notes: Note[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>
}

export function SearchView({ tasks, notes, setTasks, setNotes }: Props) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const matchedTasks = useMemo(
    () => (q ? tasks.filter((t) => t.text.toLowerCase().includes(q)) : []),
    [tasks, q],
  )
  const matchedNotes = useMemo(
    () => (q ? notes.filter((n) => n.text.toLowerCase().includes(q)) : []),
    [notes, q],
  )

  const toggleTask = (id: string) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    )
  const removeTask = (id: string) =>
    setTasks((prev) => prev.filter((t) => t.id !== id))
  const updateTask = (id: string, patch: Partial<Task>) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))

  const removeNote = (id: string) =>
    setNotes((prev) => prev.filter((n) => n.id !== id))
  const updateNote = (id: string, patch: Partial<Note>) =>
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)))

  const nothing = q && matchedTasks.length === 0 && matchedNotes.length === 0

  return (
    <section className="view">
      <header className="view-header">
        <h1>Search</h1>
        <p className="subtitle">Find across tasks and notes.</p>
      </header>

      <form className="composer" onSubmit={(e) => e.preventDefault()}>
        <input
          className="composer-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          aria-label="Search"
          autoComplete="off"
          type="search"
        />
      </form>

      {!q && <p className="empty">Type to search your tasks and notes.</p>}
      {nothing && <p className="empty">No matches for “{query}”.</p>}

      {matchedTasks.length > 0 && (
        <>
          <h2 className="section-title">Tasks</h2>
          <ul className="list">
            {matchedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onDelete={removeTask}
                onUpdate={updateTask}
              />
            ))}
          </ul>
        </>
      )}

      {matchedNotes.length > 0 && (
        <>
          <h2 className="section-title">Notes</h2>
          <ul className="list">
            {matchedNotes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                onDelete={removeNote}
                onUpdate={updateNote}
              />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
