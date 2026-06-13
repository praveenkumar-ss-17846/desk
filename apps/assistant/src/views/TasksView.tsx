import { useState } from 'react'
import type { Task } from '../types'

type Props = {
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
}

export function TasksView({ tasks, setTasks }: Props) {
  const [draft, setDraft] = useState('')

  function addTask() {
    const text = draft.trim()
    if (!text) return
    setTasks((prev) => [
      { id: crypto.randomUUID(), text, done: false, createdAt: Date.now() },
      ...prev,
    ])
    setDraft('')
  }

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    )
  }

  function removeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const remaining = tasks.filter((t) => !t.done).length

  return (
    <section className="view">
      <header className="view-header">
        <h1>Tasks</h1>
        <p className="subtitle">
          {tasks.length === 0
            ? 'Nothing yet.'
            : remaining === 0
              ? 'All clear — nice work.'
              : `${remaining} task${remaining === 1 ? '' : 's'} to go`}
        </p>
      </header>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault()
          addTask()
        }}
      >
        <input
          className="composer-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a task…"
          aria-label="New task"
          autoComplete="off"
        />
        <button className="composer-btn" type="submit" aria-label="Add task">
          +
        </button>
      </form>

      <ul className="list">
        {tasks.length === 0 && (
          <li className="empty">Add your first task above.</li>
        )}
        {tasks.map((task) => (
          <li key={task.id} className={`task ${task.done ? 'done' : ''}`}>
            <label className="task-label">
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
              />
              <span className="task-text">{task.text}</span>
            </label>
            <button
              className="icon-btn"
              onClick={() => removeTask(task.id)}
              aria-label="Delete task"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
