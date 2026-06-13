import { useState } from 'react'
import type { Task } from '../types'
import { formatDue, fromInputValue, toInputValue } from '../lib/date'

type Props = {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, patch: Partial<Task>) => void
}

export function TaskItem({ task, onToggle, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(task.text)
  const [due, setDue] = useState(toInputValue(task.dueAt))

  function save() {
    const trimmed = text.trim()
    if (!trimmed) return
    onUpdate(task.id, { text: trimmed, dueAt: fromInputValue(due) })
    setEditing(false)
  }

  if (editing) {
    return (
      <li className="task editing">
        <form
          className="edit-form"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <input
            className="composer-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Edit task"
            autoFocus
          />
          <input
            className="composer-input composer-date"
            type="datetime-local"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            aria-label="Due date"
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

  const due_ = task.dueAt ? formatDue(task.dueAt) : null

  return (
    <li className={`task ${task.done ? 'done' : ''}`}>
      <label className="task-label">
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => onToggle(task.id)}
        />
        <span className="task-main">
          <span className="task-text">{task.text}</span>
          {due_ && !task.done && (
            <span className={`due due-${due_.tone}`}>{due_.label}</span>
          )}
        </span>
      </label>
      <button
        className="icon-btn"
        onClick={() => setEditing(true)}
        aria-label="Edit task"
      >
        ✎
      </button>
      <button
        className="icon-btn"
        onClick={() => onDelete(task.id)}
        aria-label="Delete task"
      >
        ×
      </button>
    </li>
  )
}
