import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Database URL from environment
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://user:password@localhost:5432/agriculture_db"
)

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("SQL_ECHO", "False") == "True",
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for ORM models
Base = declarative_base()

def get_db():
    """Dependency for FastAPI to inject DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database (create all tables)."""
    Base.metadata.create_all(bind=engine)
