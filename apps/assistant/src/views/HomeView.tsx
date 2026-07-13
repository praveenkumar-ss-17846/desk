import type { Note, Tab, Task } from '../types'
import { visible } from '../lib/store'

type Props = {
  tasks: Task[]
  notes: Note[]
  onNavigate: (tab: Tab) => void
}

function greeting(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function HomeView({ tasks, notes, onNavigate }: Props) {
  const now = new Date()
  const openTasks = visible(tasks)
  const noteCount = visible(notes).length
  const remaining = openTasks.filter((t) => !t.done).length
  const today = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <section className="view">
      <header className="view-header">
        <p className="date">{today}</p>
        <h1>{greeting(now.getHours())}</h1>
        <p className="subtitle">
          {remaining === 0
            ? 'No open tasks. Enjoy your day.'
            : `You have ${remaining} task${remaining === 1 ? '' : 's'} to do.`}
        </p>
      </header>

      <div className="cards">
        <button className="card" onClick={() => onNavigate('tasks')}>
          <span className="card-num">{remaining}</span>
          <span className="card-label">Open tasks</span>
        </button>
        <button className="card" onClick={() => onNavigate('notes')}>
          <span className="card-num">{noteCount}</span>
          <span className="card-label">Notes</span>
        </button>
      </div>
    </section>
  )
}
