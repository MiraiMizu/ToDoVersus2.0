'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Check, Plus, Trash2 } from 'lucide-react'
import { getLocalDateString } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function PersonalTodos() {
  const today = getLocalDateString()
  const { data, mutate } = useSWR(`/api/todos?date=${today}`, fetcher)
  const [newTodo, setNewTodo] = useState('')
  const [loading, setLoading] = useState(false)

  const todos = data?.todos || []

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim() || loading) return

    const content = newTodo
    setNewTodo('')
    setLoading(true)

    // Optimistic Update
    const optimisticTodo = { id: 'temp-' + Date.now(), content, isCompleted: false, date: today }
    mutate({ todos: [...todos, optimisticTodo] }, false)

    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, date: today })
      })
      if (!res.ok) throw new Error('Failed to add todo')
    } catch (error) {
      console.error(error)
      setNewTodo(content) // Restore input on error
    } finally {
      setLoading(false)
      mutate()
    }
  }

  const toggleComplete = async (id: string, current: boolean) => {
    // Optimistic Update
    mutate({ todos: todos.map((t: any) => t.id === id ? { ...t, isCompleted: !current } : t) }, false)
    
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: !current })
      })
      if (!res.ok) throw new Error('Failed to toggle todo')
    } catch (error) {
      console.error(error)
    } finally {
      mutate()
    }
  }

  const handleDelete = async (id: string) => {
    // Optimistic Update
    mutate({ todos: todos.filter((t: any) => t.id !== id) }, false)

    try {
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete todo')
    } catch (error) {
      console.error(error)
    } finally {
      mutate()
    }
  }


  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          📝 Daily Focus
        </h2>
        <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          {todos.filter((t: any) => t.isCompleted).length} / {todos.length}
        </span>
      </div>

      <div className="space-y-2 py-1">
        {todos.map((todo: any) => (
          <div key={todo.id} className="flex items-center gap-3 p-2.5 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200">
            <button 
              onClick={() => toggleComplete(todo.id, todo.isCompleted)}
              className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border-2 transition-all ${
                todo.isCompleted 
                  ? 'bg-emerald-500 border-emerald-500 text-white' 
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-violet-500 cursor-pointer'
              }`}
            >
              {todo.isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
            </button>
            <span className={`text-sm flex-1 ${todo.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
              {todo.content}
            </span>
            {/* Always visible delete button — important for mobile/touch */}
            <button
              onClick={() => handleDelete(todo.id)}
              className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all active:scale-90 flex-shrink-0"
              aria-label="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {todos.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">No tasks for today. Add one below!</p>
        )}
      </div>

      <form onSubmit={handleAdd} className="relative mt-1">
        <input 
          type="text"
          placeholder="Add a new task..."
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          disabled={loading}
          className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all"
        />
        <button 
          type="submit"
          disabled={!newTodo.trim() || loading}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:bg-slate-400 text-white rounded-lg transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
