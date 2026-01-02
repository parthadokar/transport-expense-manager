import { useEffect, useState } from 'react'
import './index.css'
import { getTasks,postTask,updateTask,deleteTask } from './services/tasksApi'

function App() {
  const [tasks,setTasks] = useState([])
  const [editingId,setEditingId] = useState(null)
  const [form,setForm] = useState({
    name: '',
    total_cost: '',
    total_spent: ''
  })

  useEffect(() => {
    loadTasks()
  },[])

  async function loadTasks() {
    console.log('Fetching tasks...')
    const data = await getTasks()
    console.log('Tasks received:', data)
    setTasks(data)
  }
   function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }
  async function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      name: form.name,
      total_cost: Number(form.total_cost),
      total_spent: Number(form.total_spent) 
    }

    if(editingId) {
      await updateTask(editingId,payload)
    } else {
      await postTask(payload)
    }
    setForm({name: '',total_cost: '',total_spent: ''})
    setEditingId(null)
    loadTasks()
  }

  function startEdit(task) {
    setEditingId(task.id)
    setForm({
      name: task.name,
      total_cost: task.total_cost ?? '', 
      total_spent: task.total_spent ?? ''
    })
  }

  async function handleDelete(id) {
    await deleteTask(id)
    loadTasks()
  }
  
  return (
    <div>
      <h1>Transport Expense Manager</h1>
      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Task name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          name="total_cost"
          type="number"
          placeholder="Total cost"
          value={form.total_cost}
          onChange={handleChange}
        />

        <input
          name="total_spent"
          type="number"
          placeholder="Total spent"
          value={form.total_spent}
          onChange={handleChange}
        />

        <button type="submit">
          {editingId ? 'Update Task' : 'Add Task'}
        </button>
      </form>
      <hr />

      <div className='task'>
        {tasks.length === 0 ? (
          <p>No tasks found</p>
        ): (
          tasks.map((task) => (
            <div key={task.id}>
              <h3>{task.name}</h3>
              <p>Total cost: {task.total_cost}</p>
              <p>Total spent: {task.total_spent}</p>
              <p>Profit: {task.profit}</p>
              <button onClick={() => startEdit(task)}>Edit</button>
              <button onClick={() => handleDelete(task.id)}>Delete</button>
              <hr/>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default App