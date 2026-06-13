import { useMemo, useState } from 'react'
import type { Task } from '../types'
import { fromInputValue } from '../lib/date'
import { TaskItem } from '../components/TaskItem'

type Props = {
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  reminders: {
    permission: NotificationPermission | 'unsupported'
    requestPermission: () => void
  }
}

// Open tasks first (soonest due date first, undated last), completed last.
function sortTasks(a: Task, b: Task) {
  if (a.done !== b.done) return a.done ? 1 : -1
  if (a.done) return b.createdAt - a.createdAt
  if (a.dueAt && b.dueAt) return a.dueAt - b.dueAt
  if (a.dueAt) return -1
  if (b.dueAt) return 1
  return b.createdAt - a.createdAt
}

export function TasksView({ tasks, setTasks, reminders }: Props) {
  const [draft, setDraft] = useState('')
  const [due, setDue] = useState('')

  const sorted = useMemo(() => [...tasks].sort(sortTasks), [tasks])
  const remaining = tasks.filter((t) => !t.done).length
  const hasDueDates = tasks.some((t) => t.dueAt && !t.done)

  function addTask() {
    const text = draft.trim()
    if (!text) return
    setTasks((prev) => [
      {
        id: crypto.randomUUID(),
        text,
        done: false,
        createdAt: Date.now(),
        dueAt: fromInputValue(due),
      },
      ...prev,
    ])
    setDraft('')
    setDue('')
  }

  const toggle = (id: string) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    )
  const remove = (id: string) =>
    setTasks((prev) => prev.filter((t) => t.id !== id))
  const update = (id: string, patch: Partial<Task>) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))

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

      {hasDueDates && reminders.permission === 'default' && (
        <button className="banner" onClick={reminders.requestPermission}>
          🔔 Enable reminders for tasks with due dates
        </button>
      )}

      <form
        className="composer composer-column"
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
        <div className="composer-row">
          <input
            className="composer-input composer-date"
            type="datetime-local"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            aria-label="Due date (optional)"
          />
          <button className="composer-btn-wide" type="submit">
            Add task
          </button>
        </div>
      </form>

      <ul className="list">
        {tasks.length === 0 && (
          <li className="empty">Add your first task above.</li>
        )}
        {sorted.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={toggle}
            onDelete={remove}
            onUpdate={update}
          />
        ))}
      </ul>
    </section>
  )
}
