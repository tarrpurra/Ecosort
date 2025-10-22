from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from model.model import User
from model.connect import SessionLocal

router=APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
@router.get("/Center_detail")
def get_center_detail(id: int):
    # TODO: Implement recycling center details
    pass

