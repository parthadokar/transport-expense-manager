import { useEffect, useState } from 'react'
import './index.css'
import {
  getTasks,
  getMonthlySummary,
  postTask,
  updateTask,
  deleteTask
} from './services/tasksApi'

function App() {
  const [tasks, setTasks] = useState([])
  const [monthly, setMonthly] = useState([])
  const [viewMonth, setViewMonth] = useState(null)
  const [loadingId, setLoadingId] = useState(null)
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    name: '',
    total_cost: '',
    total_spent: ''
  })

  useEffect(() => {
    loadData(true)
  }, [])

  async function loadData(init = false) {
    const [t, m] = await Promise.all([
      getTasks(),
      getMonthlySummary()
    ])

    setTasks(t)
    setMonthly(m)

    if (init) {
      const now = new Date()
      setViewMonth(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      )
    }
  }

  function shiftMonth(delta) {
    const [y, m] = viewMonth.split('-').map(Number)
    const d = new Date(y, m - 1 + delta)
    setViewMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const payload = {
      name: form.name,
      total_cost: Number(form.total_cost),
      total_spent: Number(form.total_spent),
      created_at: `${viewMonth}-01T00:00:00Z`
    }

    if (editingId) {
      await updateTask(editingId, payload)
    } else {
      await postTask(payload)
    }

    setForm({ name: '', total_cost: '', total_spent: '' })
    setEditingId(null)

    await loadData(false)
  }

  async function handleDelete(id) {
    setLoadingId(id)
    setTasks(prev => prev.filter(t => t.id !== id))

    try {
      await deleteTask(id)
      setMonthly(await getMonthlySummary())
    } finally {
      setLoadingId(null)
    }
  }

  function startEdit(task) {
    setEditingId(task.id)
    setForm({
      name: task.name,
      total_cost: task.total_cost ?? '',
      total_spent: task.total_spent ?? ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const summary = monthly.find(m => m.month === viewMonth)
  const monthTasks = tasks.filter(t =>
    t.created_at.startsWith(viewMonth)
  )

  return (
    <div className="app">
      <h1>Transport Expense Manager</h1>

      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Task name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          required
        />

        <input
          name="total_cost"
          type="number"
          placeholder="Total cost"
          value={form.total_cost}
          onChange={e => setForm({ ...form, total_cost: e.target.value })}
        />

        <input
          name="total_spent"
          type="number"
          placeholder="Total spent"
          value={form.total_spent}
          onChange={e => setForm({ ...form, total_spent: e.target.value })}
        />

        <button type="submit">
          {editingId ? 'Update Task' : `Add to ${viewMonth}`}
        </button>
      </form>

      <hr />

      <div className="month-nav">
        <button onClick={() => shiftMonth(-1)}>◀</button>
        <span>{viewMonth}</span>
        <button onClick={() => shiftMonth(1)}>▶</button>
      </div>

      <section className="month">
        <header className="month-header">
          <h2>{viewMonth}</h2>
          <span className="month-profit">
            ₹ {summary?.total_profit ?? 0}
          </span>
        </header>

        <div className="task-list">
          {monthTasks.length === 0 && (
            <p className="empty">No records for this month</p>
          )}

          {monthTasks.map(task => (
            <div className="task-card" key={task.id}>
              <div className="task-title">{task.name}</div>

              <div className="task-grid">
                <div>
                  <label>Total Cost</label>
                  <span>₹ {task.total_cost}</span>
                </div>
                <div>
                  <label>Total Spent</label>
                  <span>₹ {task.total_spent}</span>
                </div>
                <div className="profit">
                  <label>Profit</label>
                  <span>₹ {task.profit}</span>
                </div>
              </div>

              <div className="actions">
                <button onClick={() => startEdit(task)}>
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(task.id)}
                  disabled={loadingId === task.id}
                >
                  {loadingId === task.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default App
