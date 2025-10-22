from sqlalchemy import (
    create_engine, Column, Integer, String, ForeignKey,
    DateTime, Date, Float, UniqueConstraint
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy.sql import func





Base = declarative_base()

# ---------- Users ----------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    first_name = Column(String(120))
    last_name = Column(String(120))
    address = Column(String)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    scans = relationship("Scan", back_populates="user", cascade="all, delete-orphan")
    leaderboard_entries = relationship("LeaderboardWeekly", back_populates="user", cascade="all, delete-orphan")
    impacts = relationship("ImpactDaily", back_populates="user", cascade="all, delete-orphan")

    # NEW: association object relationship for badges earned
    user_badges = relationship("UserBadge", back_populates="user", cascade="all, delete-orphan")

# ---------- Scans (one row per scan) ----------
class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True)
    user = relationship("User", back_populates="scans")

    item_name = Column(String(200))
    predicted_material = Column(String(50))   # e.g., 'plastic', 'glass', 'metal'
    confidence = Column(Float)                # 0..1
    decision = Column(String(30))             # 'Recycle' | 'Not Recyclable' | 'Special Drop-off'

    latitude = Column(Float)
    longitude = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# ---------- Recycling Centers ----------
class RecyclingCenter(Base):
    __tablename__ = "recycling_centers"

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String)
    phone = Column(String)
    website = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# ---------- Leaderboard (weekly) ----------
class LeaderboardWeekly(Base):
    __tablename__ = "leaderboard_weekly"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    user = relationship("User", back_populates="leaderboard_entries")

    week_start = Column(Date, nullable=False)  # e.g., Monday date
    points = Column(Integer, nullable=False, default=0)
    rank = Column(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "week_start", name="uq_leaderboard_user_week"),
    )

# ---------- Impact Tracker (daily totals) ----------
class ImpactDaily(Base):
    __tablename__ = "impact_daily"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    user = relationship("User", back_populates="impacts")

    day = Column(Date, nullable=False)
    co2_saved_g = Column(Float, default=0.0)
    water_saved_l = Column(Float, default=0.0)
    energy_saved_wh = Column(Float, default=0.0)

    __table_args__ = (
        UniqueConstraint("user_id", "day", name="uq_impact_user_day"),
    )

# ---------- NEW: Badges catalog ----------
class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True)
    code = Column(String(50), unique=True, nullable=False, index=True)  # e.g., 'WEEK10', 'PLASTIC_PRO'
    name = Column(String(120), nullable=False)
    description = Column(String)
    icon = Column(String)                      # optional: key or URL for an icon
    points_required = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    holders = relationship("UserBadge", back_populates="badge", cascade="all, delete-orphan")

# ---------- NEW: User ↔ Badge association with metadata ----------
class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    badge_id = Column(Integer, ForeignKey("badges.id", ondelete="CASCADE"), index=True)

    awarded_at = Column(DateTime(timezone=True), server_default=func.now())
    reason = Column(String)  # optional: e.g., '10 scans in a week'

    user = relationship("User", back_populates="user_badges")
    badge = relationship("Badge", back_populates="holders")

    __table_args__ = (
        UniqueConstraint("user_id", "badge_id", name="uq_user_badge_once"),
    )

