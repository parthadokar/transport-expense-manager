from fastapi import FastAPI,HTTPException
from pydantic import BaseModel
from typing import List

app = FastAPI(title="Expense Manager")

class Task(BaseModel):
    id: int
    name: str
    description: str | None = None
    total_cost: int
    total_spent: int
    profit: int

class TaskCreate(BaseModel):
    id: int
    name: str
    description: str | None = None
    total_cost: int
    total_spent: int

tasks: List[Task] = []

@app.post('/task',response_model=Task)
async def create_task(task:TaskCreate):
    profit = task.total_cost - task.total_spent
    new_task = Task(**task.dict(),profit=profit)
    tasks.append(new_task)
    return new_task

@app.get('/tasks',response_model=List[Task])
async def get_tasks():
    return tasks

@app.put('/task/{task_id}', response_model=Task)
async def update_task(task_id: int, updated_task: TaskCreate):
    for index, existing in enumerate(tasks):
        if existing.id == task_id:  
            profit = updated_task.total_cost - updated_task.total_spent
            new_task = Task(**updated_task.dict(), profit=profit)
            tasks[index] = new_task
            return new_task
    raise HTTPException(status_code=404, detail='Task Not Found')

@app.delete('/task/{task_id}',response_model=Task)
async def delete_task(task_id:int):
    for index,task in enumerate(tasks):
        if task.id == task_id:
            return tasks.pop(index)
    raise HTTPException(status_code=404,detail='Task Not Found')


