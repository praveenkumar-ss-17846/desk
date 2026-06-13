import type { Tab } from '../types'

type Props = {
  active: Tab
  onChange: (tab: Tab) => void
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'tasks', label: 'Tasks', icon: '✓' },
  { id: 'notes', label: 'Notes', icon: '✎' },
  { id: 'search', label: 'Search', icon: '⌕' },
]

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`nav-btn ${active === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
          aria-current={active === tab.id}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
