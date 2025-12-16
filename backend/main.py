import os
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Annotated, Optional
from sqlmodel import Field, Session, SQLModel, create_engine, select
from dotenv import load_dotenv

load_dotenv()

# Define Models
class TaskBase(SQLModel):
    name: str = Field(index=True)
    total_cost: Optional[int] = Field(default=None, index=True)
    total_spent: Optional[int] = Field(default=None, index=True)

class Task(TaskBase, table=True):
    __tablename__ = "tasks"
    id: Optional[int] = Field(default=None, primary_key=True)
    profit: Optional[int] = Field(default=None)

class TaskPublic(TaskBase):
    id: int
    profit: Optional[int]

class TaskCreate(TaskBase):
    pass

class TaskUpdate(SQLModel):
    name: Optional[str] = None
    total_cost: Optional[int] = None
    total_spent: Optional[int] = None

# Setup Postgres
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set")

# Create engine
engine = create_engine(DATABASE_URL, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]

# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    create_db_and_tables()
    yield
    # Shutdown: Dispose engine
    engine.dispose()

app = FastAPI(title="Expense Manager", lifespan=lifespan)

origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Calculate Profit
def calculate_profit(task: Task):
    if task.total_cost is not None and task.total_spent is not None:
        task.profit = task.total_cost - task.total_spent
    else:
        task.profit = None

# API Routes
@app.get("/")
def read_root():
    return {"message": "Expense Manager API"}

@app.post('/task', response_model=TaskPublic)
async def create_task(task: TaskCreate, session: SessionDep):
    db_task = Task.model_validate(task)
    calculate_profit(db_task)
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task

@app.get('/tasks/{task_id}', response_model=TaskPublic)
def read_task(task_id: int, session: SessionDep) -> Task:
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.get('/tasks', response_model=list[TaskPublic])
async def get_tasks(
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=1000)] = 1000
):
    tasks = session.exec(select(Task).offset(offset).limit(limit)).all()
    return tasks

@app.patch('/tasks/{task_id}', response_model=TaskPublic)
async def update_task(task_id: int, task: TaskUpdate, session: SessionDep):
    task_db = session.get(Task, task_id)
    if not task_db:
        raise HTTPException(status_code=404, detail="Task not found")
    task_data = task.model_dump(exclude_unset=True)
    task_db.sqlmodel_update(task_data)
    calculate_profit(task_db)
    session.add(task_db)
    session.commit()
    session.refresh(task_db)
    return task_db

@app.delete('/tasks/{task_id}')
async def delete_task(task_id: int, session: SessionDep):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    session.delete(task)
    session.commit()
    return {"ok": True}