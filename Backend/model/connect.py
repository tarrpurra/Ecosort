from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

# -------- Connect to the Database ----------

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL, echo=False, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def connect_DB():
    # Create engine and session
    try:
        with engine.connect() as connection:
            print("Successfully connected to the PostgreSQL Database.")
    except Exception as ex:
        print(f"Failed to connect: {ex}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()