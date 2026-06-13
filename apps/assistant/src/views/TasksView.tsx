import { useMemo, useState } from 'react'
import type { Repeat, Task } from '../types'
import { fromInputValue, nextOccurrence } from '../lib/date'
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

const ALL = '__all__'

export function TasksView({ tasks, setTasks, reminders }: Props) {
  const [draft, setDraft] = useState('')
  const [due, setDue] = useState('')
  const [repeat, setRepeat] = useState<Repeat>('none')
  const [tag, setTag] = useState('')
  const [filter, setFilter] = useState<string>(ALL)

  const tags = useMemo(
    () => [...new Set(tasks.map((t) => t.tag).filter(Boolean) as string[])].sort(),
    [tasks],
  )
  const sorted = useMemo(
    () =>
      [...tasks]
        .filter((t) => filter === ALL || t.tag === filter)
        .sort(sortTasks),
    [tasks, filter],
  )
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
        repeat,
        tag: tag.trim() || undefined,
      },
      ...prev,
    ])
    setDraft('')
    setDue('')
    setRepeat('none')
    setTag('')
  }

  // Completing a recurring task reschedules it instead of marking it done.
  function toggle(id: string) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        if (!t.done && t.repeat && t.repeat !== 'none') {
          return { ...t, dueAt: nextOccurrence(t.dueAt ?? Date.now(), t.repeat) }
        }
        return { ...t, done: !t.done }
      }),
    )
  }

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
        </div>
        <div className="composer-row">
          <input
            className="composer-input"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Tag (optional)"
            aria-label="Tag"
            autoComplete="off"
          />
          <button className="composer-btn-wide" type="submit">
            Add task
          </button>
        </div>
      </form>

      {tags.length > 0 && (
        <div className="chips-row">
          <button
            className={`filter-chip ${filter === ALL ? 'active' : ''}`}
            onClick={() => setFilter(ALL)}
          >
            All
          </button>
          {tags.map((t) => (
            <button
              key={t}
              className={`filter-chip ${filter === t ? 'active' : ''}`}
              onClick={() => setFilter(t)}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      <ul className="list">
        {sorted.length === 0 && (
          <li className="empty">
            {tasks.length === 0
              ? 'Add your first task above.'
              : 'No tasks with this tag.'}
          </li>
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
