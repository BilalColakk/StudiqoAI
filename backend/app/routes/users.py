from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import re

from ..database import SessionLocal
from .. import models
from ..schemas import UserCreate, UserLogin, UserResponse, UserUpdate, ForgotPasswordRequest, ResetPasswordRequest
from ..services.security import hash_password, verify_password
from ..services.auth import create_access_token, decode_access_token
from ..services.dependencies import get_db, get_current_user
from ..services.email import send_verification_email, send_password_reset_email

router = APIRouter(tags=["Users"])

def validate_email_format(email: str):
    # Regex to ensure valid domain structure (like @gmail.com)
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    if not re.match(pattern, email):
        raise HTTPException(status_code=400, detail="Geçerli bir e-posta adresi giriniz.")

@router.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    validate_email_format(user.email)

    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kullanımda.")

    hashed = hash_password(user.password)

    new_user = models.User(
        first_name=user.first_name,
        last_name=user.last_name,
        phone_number=user.phone_number,
        email=user.email,
        password_hash=hashed,
        is_verified=False
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate verification token
    verify_token = create_access_token({"sub": new_user.email, "type": "verify"})
    send_verification_email(new_user.email, verify_token)

    return {"message": "Kayıt başarılı. Lütfen e-posta adresinize gönderilen link ile hesabınızı doğrulayın."}

@router.post("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    payload = decode_access_token(token)
    if not payload or payload.get("type") != "verify":
        raise HTTPException(status_code=400, detail="Geçersiz veya süresi dolmuş doğrulama linki.")
        
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Kullanıcı bulunamadı.")
        
    if user.is_verified:
        return {"message": "Hesap zaten doğrulanmış."}
        
    user.is_verified = True
    db.commit()
    return {"message": "Hesabınız başarıyla doğrulandı."}

@router.post("/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()

    if not db_user:
        raise HTTPException(status_code=400, detail="Kayıtlı kullanıcı bulunamadı.")

    if not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Hatalı şifre.")

    if not db_user.is_verified:
        raise HTTPException(status_code=403, detail="Lütfen giriş yapmadan önce e-posta adresinizi doğrulayın.")

    token = create_access_token({"sub": db_user.email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "first_name": db_user.first_name,
        "last_name": db_user.last_name
    }

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        # Don't reveal user existence for security, just return success
        return {"message": "Eğer e-posta sistemimize kayıtlıysa, şifre sıfırlama linki gönderildi."}
        
    reset_token = create_access_token({"sub": user.email, "type": "reset"})
    send_password_reset_email(user.email, reset_token)
    return {"message": "E-posta adresinize şifre sıfırlama linki gönderildi."}

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    payload = decode_access_token(req.token)
    if not payload or payload.get("type") != "reset":
        raise HTTPException(status_code=400, detail="Geçersiz veya süresi dolmuş sıfırlama linki.")
        
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Kullanıcı bulunamadı.")
        
    user.password_hash = hash_password(req.new_password)
    db.commit()
    return {"message": "Şifreniz başarıyla yenilendi."}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_me(user_update: UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if user_update.first_name is not None:
        current_user.first_name = user_update.first_name
    if user_update.last_name is not None:
        current_user.last_name = user_update.last_name
    if user_update.phone_number is not None:
        current_user.phone_number = user_update.phone_number
    if user_update.email is not None and user_update.email != current_user.email:
        # Check if new email is taken
        validate_email_format(user_update.email)
        existing = db.query(models.User).filter(models.User.email == user_update.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kullanımda.")
        current_user.email = user_update.email
    if user_update.password is not None and len(user_update.password) > 0:
        current_user.password_hash = hash_password(user_update.password)
        
    db.commit()
    db.refresh(current_user)
    return current_user