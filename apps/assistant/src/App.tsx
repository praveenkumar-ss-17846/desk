import './App.css'
import { useLocalStorage } from './lib/useLocalStorage'
import { useTheme } from './lib/useTheme'
import { useReminders } from './lib/useReminders'
import type { Note, Tab, Task } from './types'
import { BottomNav } from './components/BottomNav'
import { HomeView } from './views/HomeView'
import { TasksView } from './views/TasksView'
import { NotesView } from './views/NotesView'
import { SearchView } from './views/SearchView'

function App() {
  const [tab, setTab] = useLocalStorage<Tab>('desk.assistant.tab', 'home')
  const [tasks, setTasks] = useLocalStorage<Task[]>('desk.assistant.tasks', [])
  const [notes, setNotes] = useLocalStorage<Note[]>('desk.assistant.notes', [])
  const { theme, toggle } = useTheme()
  const reminders = useReminders(tasks)

  return (
    <div className="app">
      <div className="topbar">
        <span className="brand">Assistant</span>
        <button
          className="icon-btn"
          onClick={toggle}
          aria-label="Toggle theme"
          title="Toggle light / dark"
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </div>

      <main className="content">
        {tab === 'home' && (
          <HomeView tasks={tasks} notes={notes} onNavigate={setTab} />
        )}
        {tab === 'tasks' && (
          <TasksView tasks={tasks} setTasks={setTasks} reminders={reminders} />
        )}
        {tab === 'notes' && <NotesView notes={notes} setNotes={setNotes} />}
        {tab === 'search' && (
          <SearchView
            tasks={tasks}
            notes={notes}
            setTasks={setTasks}
            setNotes={setNotes}
          />
        )}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}

export default App
