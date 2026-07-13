export type Repeat = 'none' | 'daily' | 'weekly' | 'monthly'

export type Task = {
  id: string
  text: string
  done: boolean
  createdAt: number
  updatedAt?: number
  dueAt?: number
  repeat?: Repeat
  tag?: string
  deleted?: boolean
}

export type Note = {
  id: string
  text: string
  updatedAt: number
  pinned?: boolean
  deleted?: boolean
}

export type Tab = 'home' | 'tasks' | 'notes' | 'search' | 'settings'
