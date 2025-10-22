from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from model.model import User
from model.connect import SessionLocal
from passlib.context import CryptContext
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel

import os

security = HTTPBearer()
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Maximum password length for bcrypt (72 bytes)
MAX_PASSWORD_LENGTH = 72

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def validate_and_prepare_password(password: str) -> str:
    """
    Validate and prepare password for bcrypt hashing.
    Bcrypt has a 72-byte limit, so we need to handle this.
    """
    if not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password cannot be empty"
        )
    
    # Convert to bytes to check actual byte length
    password_bytes = password.encode('utf-8')
    
    if len(password_bytes) > MAX_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password is too long. Maximum length is {MAX_PASSWORD_LENGTH} bytes."
        )
    
    return password

def get_password_hash(password: str) -> str:
    """Hash a password after validation"""
    validated_password = validate_and_prepare_password(password)
    return pwd_context.hash(validated_password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    # Truncate to 72 bytes for verification (in case of legacy passwords)
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > MAX_PASSWORD_LENGTH:
        plain_password = password_bytes[:MAX_PASSWORD_LENGTH].decode('utf-8', errors='ignore')
    return pwd_context.verify(plain_password, hashed_password)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Update own profile (authenticated)
class UpdateProfileRequest(BaseModel):
    name: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    address: str | None = None

@router.put("/profile", status_code=status.HTTP_200_OK)
def update_my_profile(
    payload: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.name is not None:
        user.name = payload.name
    if payload.first_name is not None:
        user.first_name = payload.first_name
    if payload.last_name is not None:
        user.last_name = payload.last_name
    if payload.address is not None:
        user.address = payload.address

    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "address": user.address,
        "created_at": str(user.created_at),
    }

# Get user Data
@router.get("/profile_data")
def fetch_user_data(id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == id).first()
    if user:
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "created_at": str(user.created_at)
        }
    else:
        raise HTTPException(status_code=404, detail="User not found")

@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "address": current_user.address,
        "total_scans": 0,  # TODO: calculate from scans table
        "co2_saved": 0.0,  # TODO: calculate from impacts table
        "level": "Beginner",  # TODO: implement leveling system
        "created_at": str(current_user.created_at)
    }

@router.post("/insert_profile_data", status_code=status.HTTP_201_CREATED)
def insert_user_data(name: str, email: str, password: str, db: Session = Depends(get_db)):
    """
    Insert User Data to the table
    """
    hashed_password = get_password_hash(password)
    db_user = User(name=name, email=email, password_hash=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/update_profile_data")
def update_user_data(id: int, name: str = None, email: str = None, db: Session = Depends(get_db)):
    """
    Update User Data in the table
    """
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if name is not None:
        user.name = name
    if email is not None:
        user.email = email
    
    db.commit()
    db.refresh(user)
    return user

@router.put("/update_password")
def update_password(id: int, password: str, db: Session = Depends(get_db)):
    """Update Password"""
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if password is not None:
        hashed_password = get_password_hash(password)
        user.password_hash = hashed_password
    
    db.commit()
    db.refresh(user)
    return user