import { useEffect, useState } from 'react'
import './index.css'
import { getTasks } from './services/tasksApi'

function App() {
  const [tasks,setTasks] = useState([])
  useEffect(() => {
    async function load() {
      const data = await getTasks()
      setTasks(data)
    }
    load()
  },[])

  return (
    <div>
      <h1>Transport Expense Manager</h1>
      <div>
        {tasks.length === 0 ? (
          <p>No tasks found</p>
        ): (
          tasks.map((task) => (
            <div key={task.id}>
              <h3>{task.name}</h3>
              <p>Total cost: {task.total_cost}</p>
              <p>Total spent: {task.total_spent}</p>
              <p>Profit: {task.profit}</p>
              <hr />
            </div>
          ))
        )}
      </div>
    </div>
    
  )
}

export default App