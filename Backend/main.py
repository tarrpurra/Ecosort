from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routing.auth import router as auth_router
from routing.profile import router as profile_router
from routing.Recycle_center import router as recycle_router
from model.connect import engine
from model.model import Base
from dotenv import load_dotenv
import uvicorn

# Load environment from .env
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

# Lightweight migration for SQLite: add new user columns if missing
def ensure_user_columns():
    try:
        with engine.connect() as conn:
            res = conn.execute("PRAGMA table_info(users);")
            cols = {row[1] for row in res}
            alter_stmts = []
            if "first_name" not in cols:
                alter_stmts.append("ALTER TABLE users ADD COLUMN first_name VARCHAR(120);")
            if "last_name" not in cols:
                alter_stmts.append("ALTER TABLE users ADD COLUMN last_name VARCHAR(120);")
            if "address" not in cols:
                alter_stmts.append("ALTER TABLE users ADD COLUMN address VARCHAR;")
            for stmt in alter_stmts:
                conn.execute(stmt)
    except Exception as e:
        # Intentionally avoid raising to not block startup
        print(f"User columns migration skipped/failed: {e}")

ensure_user_columns()

app = FastAPI(title="EcoSort API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://a79947e6e0a5.ngrok-free.app ",
        "http://a79947e6e0a5.ngrok-free.app ",
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
app.include_router(profile_router, tags=["Profile"])
app.include_router(recycle_router, prefix="/recycle", tags=["Recycling Centers"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)