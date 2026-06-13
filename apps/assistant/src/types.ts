export type Task = {
  id: string
  text: string
  done: boolean
  createdAt: number
}

export type Note = {
  id: string
  text: string
  updatedAt: number
}

export type Tab = 'home' | 'tasks' | 'notes'
