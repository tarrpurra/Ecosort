from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routing.auth import router as auth_router
from routing.profile import router as profile_router
from routing.Recycle_center import router as recycle_router
from routing.classify import router as classify_router
from model.connect import engine
from model.model import Base
from dotenv import load_dotenv
from sqlalchemy import text
import uvicorn

# Load environment from .env
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

# Lightweight migration for SQLite: add new user columns if missing
def ensure_user_columns():
    try:
        with engine.connect() as conn:
            # First ensure the users table exists by creating it if needed
            res = conn.execute(text("PRAGMA table_info(users);"))
            cols = {row[1] for row in res}

            # If no columns found, table doesn't exist - create it first
            if not cols:
                print("Users table not found, creating it...")
                Base.metadata.create_all(bind=engine)
                # Re-check columns after creation
                res = conn.execute(text("PRAGMA table_info(users);"))
                cols = {row[1] for row in res}

            alter_stmts = []
            if "first_name" not in cols:
                alter_stmts.append("ALTER TABLE users ADD COLUMN first_name VARCHAR(120);")
            if "last_name" not in cols:
                alter_stmts.append("ALTER TABLE users ADD COLUMN last_name VARCHAR(120);")
            if "address" not in cols:
                alter_stmts.append("ALTER TABLE users ADD COLUMN address VARCHAR;")
            if "reset_token" not in cols:
                alter_stmts.append("ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);")
            if "reset_token_expires" not in cols:
                alter_stmts.append("ALTER TABLE users ADD COLUMN reset_token_expires DATETIME;")

            # Execute all ALTER statements
            for stmt in alter_stmts:
                print(f"Executing: {stmt}")
                conn.execute(text(stmt))
                conn.commit()

            if alter_stmts:
                print(f"Successfully added {len(alter_stmts)} missing columns to users table")
            else:
                print("All required columns already exist in users table")

    except Exception as e:
        # Intentionally avoid raising to not block startup
        print(f"User columns migration skipped/failed: {e}")

ensure_user_columns()

app = FastAPI(title="EcoSort API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://02812eb94604.ngrok-free.app",
        "http://02812eb94604.ngrok-free.app",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:19006",
        "http://127.0.0.1:19006",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(profile_router, prefix="/profile", tags=["Profile"])
app.include_router(recycle_router, prefix="/recycle", tags=["Recycling Centers"])
app.include_router(classify_router, prefix="/recycle", tags=["Classification"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)