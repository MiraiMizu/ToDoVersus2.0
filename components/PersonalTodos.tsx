'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Check, Plus, Trash2 } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function PersonalTodos() {
  const today = new Date().toISOString().split('T')[0]
  const { data, mutate } = useSWR(`/api/todos?date=${today}`, fetcher)
  const [newTodo, setNewTodo] = useState('')
  const [loading, setLoading] = useState(false)

  const todos = data?.todos || []

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim() || loading) return
    setLoading(true)
    await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newTodo, date: today })
    })
    setNewTodo('')
    setLoading(false)
    mutate()
  }

  const toggleComplete = async (id: string, current: boolean) => {
    mutate({ todos: todos.map((t: any) => t.id === id ? { ...t, isCompleted: !current } : t) }, false)
    await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCompleted: !current })
    })
    mutate()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' })
    mutate()
  }

  return (
    <div className="glass rounded-2xl p-5 mb-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          📝 Daily Focus
        </h2>
        <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
          {todos.filter((t: any) => t.isCompleted).length} / {todos.length}
        </span>
      </div>

      <div className="space-y-3 py-2">
        {todos.map((todo: any) => (
          <div key={todo.id} className="group flex items-center gap-4 p-3 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-300 ease-out shadow-sm hover:shadow-md">
            <button 
              onClick={() => toggleComplete(todo.id, todo.isCompleted)}
              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border-2 transition-all ${
                todo.isCompleted 
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-violet-500 cursor-pointer shadow-sm'
              }`}
            >
              {todo.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
            <span className={`text-sm flex-1 ${todo.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
              {todo.content}
            </span>
            <button
              onClick={() => handleDelete(todo.id)}
              className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all active:scale-90"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {todos.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-4">No tasks set for today. Add one below!</p>
        )}
      </div>

      <form onSubmit={handleAdd} className="relative mt-2 group">
        <input 
          type="text"
          placeholder="Add a new task..."
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          disabled={loading}
          className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-4 pr-14 py-3.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all shadow-sm"
        />
        <button 
          type="submit"
          disabled={!newTodo.trim() || loading}
          className="absolute right-2 top-2 bottom-2 w-10 flex items-center justify-center bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:bg-slate-400 text-white rounded-lg transition-all shadow-md shadow-violet-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>
    </div>
  )
}
