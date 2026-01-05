import os
from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Optional, Annotated
from sqlmodel import Field, Session, SQLModel, create_engine, select
from sqlalchemy import func
from dotenv import load_dotenv

# load_dotenv()

class TaskBase(SQLModel):
    name: str
    total_cost: Optional[int] = None
    total_spent: Optional[int] = None

class Task(TaskBase, table=True):
    __tablename__ = "tasks"
    id: Optional[int] = Field(default=None, primary_key=True)
    profit: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

class TaskPublic(TaskBase):
    id: int
    profit: Optional[int]
    created_at: datetime

class TaskCreate(TaskBase):
    created_at: Optional[datetime] = None

class TaskUpdate(SQLModel):
    name: Optional[str] = None
    total_cost: Optional[int] = None
    total_spent: Optional[int] = None

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, echo=False)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield
    engine.dispose()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
   allow_origins=[
    "http://localhost:5173",
    "https://transport-expense-manager.vercel.app"
],
    allow_methods=["*"],
    allow_headers=["*"],
)

def calculate_profit(task: Task):
    if task.total_cost is not None and task.total_spent is not None:
        task.profit = task.total_cost - task.total_spent
    else:
        task.profit = None

@app.post("/tasks", response_model=TaskPublic)
async def create_task(task: TaskCreate, session: SessionDep):
    db_task = Task.model_validate(task)
    if task.created_at:
        db_task.created_at = task.created_at
    calculate_profit(db_task)
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task

@app.get("/tasks", response_model=list[TaskPublic])
async def get_tasks(session: SessionDep):
    return session.exec(select(Task)).all()

@app.patch("/tasks/{task_id}", response_model=TaskPublic)
async def update_task(task_id: int, task: TaskUpdate, session: SessionDep):
    db_task = session.get(Task, task_id)
    if not db_task:
        raise HTTPException(status_code=404)
    db_task.sqlmodel_update(task.model_dump(exclude_unset=True))
    calculate_profit(db_task)
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: int, session: SessionDep):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404)
    session.delete(task)
    session.commit()
    return {"ok": True}

@app.get("/tasks/monthly-summary")
async def monthly_summary(session: SessionDep):
    month_expr = func.to_char(Task.created_at, "YYYY-MM")
    stmt = (
        select(
            month_expr.label("month"),
            func.sum(Task.profit).label("total_profit")
        )
        .group_by(month_expr)
        .order_by(month_expr.desc())
    )
    result = session.exec(stmt).all()
    return [{"month": m, "total_profit": p or 0} for m, p in result]
