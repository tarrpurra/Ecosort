from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from model.model import User, Scan, ImpactDaily, LeaderboardWeekly, Badge, UserBadge
from model.connect import SessionLocal
from passlib.context import CryptContext
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel

import os
from datetime import date, timedelta

security = HTTPBearer()
SECRET_KEY = os.getenv("SECRET_KEY", "f704a7f4598c84ca47963e8b262b0e50665883541fe4f59cfc3e18e15326e760a9f56d02cee75a321539c7ec2389a6810af09ea1c5211e88d381f9ba9fe12865")
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

def is_profile_complete(user: User) -> bool:
    """Check if user has completed their profile (first_name, last_name, address)"""
    return bool(user.first_name and user.last_name and user.address)

# Update own profile (authenticated)
class UpdateProfileRequest(BaseModel):
    name: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    address: str | None = None

# Complete profile (for new users or users with missing information)
class CompleteProfileRequest(BaseModel):
    first_name: str
    last_name: str
    address: str
    name: str | None = None

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
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Calculate total scans
    total_scans = db.query(Scan).filter(Scan.user_id == current_user.id).count()

    # Calculate total CO2 saved (in kg)
    co2_result = db.query(func.sum(ImpactDaily.co2_saved_g)).filter(ImpactDaily.user_id == current_user.id).scalar()
    co2_saved = (co2_result or 0) / 1000  # Convert grams to kg

    # Level system based on points (10 points per scan)
    total_points = total_scans * 10
    if total_points >= 1000:
        level = "Eco Champion"
    elif total_points >= 500:
        level = "Planet Guardian"
    elif total_points >= 250:
        level = "Eco Warrior"
    elif total_points >= 100:
        level = "Green Enthusiast"
    elif total_points >= 50:
        level = "Recycle Rookie"
    else:
        level = "Beginner"

    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "address": current_user.address,
        "total_scans": total_scans,
        "co2_saved": round(co2_saved, 2),
        "level": level,
        "created_at": str(current_user.created_at)
    }

@router.post("/complete-profile")
def complete_profile(
    profile_data: CompleteProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Complete user profile with required information"""
    # Update user profile
    current_user.first_name = profile_data.first_name
    current_user.last_name = profile_data.last_name
    current_user.address = profile_data.address

    if profile_data.name:
        current_user.name = profile_data.name

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Profile completed successfully",
        "profile_complete": True,
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "address": current_user.address,
            "created_at": str(current_user.created_at)
        }
    }

@router.get("/check-profile-status")
def check_profile_status(current_user: User = Depends(get_current_user)):
    """Check if current user's profile is complete"""
    return {
        "profile_complete": is_profile_complete(current_user),
        "missing_fields": [
            field for field, value in [
                ("first_name", current_user.first_name),
                ("last_name", current_user.last_name),
                ("address", current_user.address)
            ] if not value
        ]
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

@router.get("/rewards/stats")
def get_rewards_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user's rewards statistics"""
    try:
        total_scans = db.query(Scan).filter(Scan.user_id == current_user.id).count()
        co2_result = db.query(func.sum(ImpactDaily.co2_saved_g)).filter(ImpactDaily.user_id == current_user.id).scalar()
        co2_saved = (co2_result or 0) / 1000  # Convert to kg

        # Calculate streak (consecutive days with scans)
        scan_dates_query = db.query(Scan.created_at).filter(Scan.user_id == current_user.id).order_by(Scan.created_at.desc()).all()
        scan_dates = [d[0].date() for d in scan_dates_query]
        unique_dates = sorted(list(set(scan_dates)), reverse=True)

        streak = 0
        check_date = date.today()
        for d in unique_dates:
            if d == check_date:
                streak += 1
                check_date -= timedelta(days=1)
            elif d > check_date:
                continue
            else:
                break

        # Calculate points (10 points per scan)
        total_points = total_scans * 10

        # Level calculation
        if total_points >= 1000:
            current_level = "Eco Champion"
            next_level = None
            points_to_next = 0
        elif total_points >= 500:
            current_level = "Planet Guardian"
            next_level = "Eco Champion"
            points_to_next = 1000 - total_points
        elif total_points >= 250:
            current_level = "Eco Warrior"
            next_level = "Planet Guardian"
            points_to_next = 500 - total_points
        elif total_points >= 100:
            current_level = "Green Enthusiast"
            next_level = "Eco Warrior"
            points_to_next = 250 - total_points
        elif total_points >= 50:
            current_level = "Recycle Rookie"
            next_level = "Green Enthusiast"
            points_to_next = 100 - total_points
        else:
            current_level = "Beginner"
            next_level = "Recycle Rookie"
            points_to_next = 50 - total_points

        return {
            "total_points": total_points,
            "current_level": current_level,
            "next_level": next_level,
            "points_to_next": points_to_next,
            "items_scanned": total_scans,
            "co2_saved": round(co2_saved, 2),
            "streak_days": streak
        }
    except Exception as e:
        return {
            "total_points": 0,
            "current_level": "Beginner",
            "next_level": "Recycle Rookie",
            "points_to_next": 50,
            "items_scanned": 0,
            "co2_saved": 0,
            "streak_days": 0
        }

@router.get("/rewards/badges")
def get_user_badges(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get user's earned badges based on current stats"""
    try:
        # Calculate current stats
        total_scans = db.query(Scan).filter(Scan.user_id == current_user.id).count()

        # Calculate streak
        scan_dates_query = db.query(Scan.created_at).filter(Scan.user_id == current_user.id).order_by(Scan.created_at.desc()).all()
        scan_dates = [d[0].date() for d in scan_dates_query]
        unique_dates = sorted(list(set(scan_dates)), reverse=True)

        streak = 0
        check_date = date.today()
        for d in unique_dates:
            if d == check_date:
                streak += 1
                check_date -= timedelta(days=1)
            elif d > check_date:
                continue
            else:
                break

        # Determine earned badges based on achievements
        all_badges = [
            {"name": "First Scan", "earned": total_scans >= 1},
            {"name": "Streak Master", "earned": streak >= 7},
            {"name": "Plastic Pro", "earned": total_scans >= 50},
            {"name": "Glass Guardian", "earned": total_scans >= 100},
            {"name": "Metal Master", "earned": total_scans >= 150},
            {"name": "E-waste Expert", "earned": total_scans >= 200}
        ]

        return all_badges
    except Exception as e:
        # Return default badges if error
        return [
            {"name": "First Scan", "earned": False},
            {"name": "Streak Master", "earned": False},
            {"name": "Plastic Pro", "earned": False},
            {"name": "Glass Guardian", "earned": False},
            {"name": "Metal Master", "earned": False},
            {"name": "E-waste Expert", "earned": False}
        ]

@router.get("/rewards/leaderboard")
def get_leaderboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get weekly leaderboard"""
    try:
        from datetime import datetime, timedelta
        today = date.today()
        week_start = today - timedelta(days=today.weekday())  # Monday of current week

        # Get leaderboard entries for current week
        leaderboard_entries = db.query(LeaderboardWeekly).options(db.joinedload(LeaderboardWeekly.user)).filter(
            LeaderboardWeekly.week_start == week_start
        ).order_by(LeaderboardWeekly.rank).limit(10).all()

        leaderboard = []
        for entry in leaderboard_entries:
            leaderboard.append({
                "rank": entry.rank,
                "name": entry.user.name,
                "points": entry.points,
                "avatar": "🏆" if entry.rank == 1 else "🌟" if entry.rank == 2 else "🥉" if entry.rank == 3 else "👤"
            })

        # Add current user if not in top 10
        user_entry = db.query(LeaderboardWeekly).filter(
            LeaderboardWeekly.user_id == current_user.id,
            LeaderboardWeekly.week_start == week_start
        ).first()

        if user_entry and user_entry.rank > 10:
            leaderboard.append({
                "rank": user_entry.rank,
                "name": "You",
                "points": user_entry.points,
                "avatar": "🏆"
            })

        return leaderboard
    except Exception as e:
        return []

@router.get("/rewards/milestones")
def get_milestones(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current goals/milestones"""
    try:
        total_scans = db.query(Scan).filter(Scan.user_id == current_user.id).count()
        co2_result = db.query(func.sum(ImpactDaily.co2_saved_g)).filter(ImpactDaily.user_id == current_user.id).scalar()
        co2_saved = (co2_result or 0) / 1000  # Convert to kg

        # Calculate streak
        scan_dates_query = db.query(Scan.created_at).filter(Scan.user_id == current_user.id).order_by(Scan.created_at.desc()).all()
        scan_dates = [d[0].date() for d in scan_dates_query]
        unique_dates = sorted(list(set(scan_dates)), reverse=True)

        streak = 0
        check_date = date.today()
        for d in unique_dates:
            if d == check_date:
                streak += 1
                check_date -= timedelta(days=1)
            elif d > check_date:
                continue
            else:
                break

        milestones = [
            {"goal": "Scan 150 items", "progress": min(total_scans, 150), "total": 150, "reward": "+500 points"},
            {"goal": "Save 20kg CO₂", "progress": min(co2_saved, 20), "total": 20, "reward": "Eco Hero badge"},
            {"goal": "30-day streak", "progress": min(streak, 30), "total": 30, "reward": "Premium features"}
        ]

        return milestones
    except Exception as e:
        return [
            {"goal": "Scan 150 items", "progress": 0, "total": 150, "reward": "+500 points"},
            {"goal": "Save 20kg CO₂", "progress": 0, "total": 20, "reward": "Eco Hero badge"},
            {"goal": "30-day streak", "progress": 0, "total": 30, "reward": "Premium features"}
        ]