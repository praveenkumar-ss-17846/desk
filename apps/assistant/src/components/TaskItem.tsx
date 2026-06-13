import { useState } from 'react'
import type { Repeat, Task } from '../types'
import { formatDue, fromInputValue, toInputValue } from '../lib/date'

type Props = {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, patch: Partial<Task>) => void
}

const REPEAT_LABEL: Record<Repeat, string> = {
  none: '',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
}

export function TaskItem({ task, onToggle, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(task.text)
  const [due, setDue] = useState(toInputValue(task.dueAt))
  const [repeat, setRepeat] = useState<Repeat>(task.repeat ?? 'none')
  const [tag, setTag] = useState(task.tag ?? '')

  function save() {
    const trimmed = text.trim()
    if (!trimmed) return
    onUpdate(task.id, {
      text: trimmed,
      dueAt: fromInputValue(due),
      repeat,
      tag: tag.trim() || undefined,
    })
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
          <div className="composer-row">
            <select
              className="composer-input composer-select"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value as Repeat)}
              aria-label="Repeat"
            >
              <option value="none">No repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <input
              className="composer-input"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Tag (optional)"
              aria-label="Tag"
            />
          </div>
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
  const repeats = task.repeat && task.repeat !== 'none'

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
          <span className="task-meta">
            {due_ && !task.done && (
              <span className={`due due-${due_.tone}`}>{due_.label}</span>
            )}
            {repeats && <span className="chip">↻ {REPEAT_LABEL[task.repeat!]}</span>}
            {task.tag && <span className="chip">#{task.tag}</span>}
          </span>
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
