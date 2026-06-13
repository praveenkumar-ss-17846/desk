export type Task = {
  id: string
  text: string
  done: boolean
  createdAt: number
  dueAt?: number
}

export type Note = {
  id: string
  text: string
  updatedAt: number
  pinned?: boolean
}

export type Tab = 'home' | 'tasks' | 'notes' | 'search'
