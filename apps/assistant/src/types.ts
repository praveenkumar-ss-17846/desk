export type Repeat = 'none' | 'daily' | 'weekly' | 'monthly'

export type Task = {
  id: string
  text: string
  done: boolean
  createdAt: number
  dueAt?: number
  repeat?: Repeat
  tag?: string
}

export type Note = {
  id: string
  text: string
  updatedAt: number
  pinned?: boolean
}

export type Tab = 'home' | 'tasks' | 'notes' | 'search' | 'settings'
