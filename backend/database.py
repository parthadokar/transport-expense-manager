import os
from contextlib import asynccontextmanager
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Create connection pool
db_pool = None

def get_db_pool():
    global db_pool
    if db_pool is None:
        db_pool = SimpleConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=DATABASE_URL
        )
    return db_pool

def get_db_connection():
    """Get a connection from the pool"""
    pool = get_db_pool()
    return pool.getconn()

def return_db_connection(conn):
    """Return a connection to the pool"""
    pool = get_db_pool()
    pool.putconn(conn)

def close_db_pool():
    """Close all connections in the pool"""
    global db_pool
    if db_pool:
        db_pool.closeall()
        db_pool = None