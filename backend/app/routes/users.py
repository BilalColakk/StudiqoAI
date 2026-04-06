from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import SessionLocal
from .. import models
from ..schemas import UserCreate, UserLogin
from ..services.security import hash_password, verify_password
from ..services.auth import create_access_token

router = APIRouter(tags=["Users"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(user.password)

    new_user = models.User(
        email=user.email,
        password_hash=hashed
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User created successfully"}


@router.post("/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()

    if not db_user:
        raise HTTPException(status_code=400, detail="User not found")

    if not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Wrong password")

    token = create_access_token({"sub": db_user.email})

    return {
        "access_token": token,
        "token_type": "bearer"
    }