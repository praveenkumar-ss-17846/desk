import { useMemo } from 'react'
import './App.css'
import { useLocalStorage } from './lib/useLocalStorage'
import { useTheme } from './lib/useTheme'
import { useReminders } from './lib/useReminders'
import { useAutoSync } from './lib/useAutoSync'
import { visible } from './lib/store'
import type { Note, Tab, Task } from './types'
import { BottomNav } from './components/BottomNav'
import { HomeView } from './views/HomeView'
import { TasksView } from './views/TasksView'
import { NotesView } from './views/NotesView'
import { SearchView } from './views/SearchView'
import { SettingsView } from './views/SettingsView'

function App() {
  const [tab, setTab] = useLocalStorage<Tab>('desk.assistant.tab', 'home')
  const [tasks, setTasks] = useLocalStorage<Task[]>('desk.assistant.tasks', [])
  const [notes, setNotes] = useLocalStorage<Note[]>('desk.assistant.notes', [])
  const [syncCode, setSyncCode] = useLocalStorage<string>(
    'desk.assistant.synccode',
    '',
  )
  const { theme, toggle } = useTheme()

  const liveTasks = useMemo(() => visible(tasks), [tasks])
  const reminders = useReminders(liveTasks)
  const sync = useAutoSync({ code: syncCode, tasks, notes, setTasks, setNotes })

  return (
    <div className="app">
      <div className="topbar">
        <span className="brand">Assistant</span>
        <div className="topbar-actions">
          <button
            className="icon-btn"
            onClick={toggle}
            aria-label="Toggle theme"
            title="Toggle light / dark"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <button
            className={`icon-btn ${tab === 'settings' ? 'active' : ''}`}
            onClick={() => setTab('settings')}
            aria-label="Settings"
            title="Settings"
          >
            ⚙
          </button>
        </div>
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
        {tab === 'settings' && (
          <SettingsView
            tasks={tasks}
            notes={notes}
            setTasks={setTasks}
            setNotes={setNotes}
            code={syncCode}
            setCode={setSyncCode}
            sync={sync}
          />
        )}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}

export default App
