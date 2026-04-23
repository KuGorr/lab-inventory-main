from datetime import datetime, timedelta
from typing import Callable
import os

from fastapi import Depends, HTTPException, status, APIRouter, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from pydantic import BaseModel

from .database import get_db, SessionLocal
from . import models
from app.utils import hash_password, verify_password
from app.utils.email_utils import send_reset_email


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def create_access_token(user: models.User) -> str:
    payload = {
        "sub": user.username,
        "role": user.role,
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_reset_token(user_id: int) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(hours=48),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str | None = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception

    return user


def require_role(required: str) -> Callable:
    def wrapper(current_user: models.User = Depends(get_current_user)) -> models.User:
        roles = ["user", "compat", "manager", "admin"]

        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unknown role"
            )

        if roles.index(current_user.role) < roles.index(required):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )

        return current_user

    return wrapper


def require_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    user = db.query(models.User).filter(models.User.username == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(user)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role
        }
    }


def create_default_admin() -> None:
    db = SessionLocal()
    try:
        admin = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin:
            new_admin = models.User(
                username="admin",
                password_hash=hash_password("admin123"),
                is_admin=True,
                role="admin",
            )
            db.add(new_admin)
            db.commit()
            print(">>> Created default admin: admin / admin123")
    finally:
        db.close()


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetPayload(BaseModel):
    token: str
    new_password: str


@router.post("/request-password-reset")
def request_password_reset(data: PasswordResetRequest, request: Request, db: Session = Depends(get_db)):

    user = db.query(models.User).filter(models.User.email == data.email).first()

    if not user:
        return {"message": "If the email exists, a reset link has been sent."}

    token = create_reset_token(user.id)

    frontend_base = os.getenv("FRONTEND_URL", "http://localhost:5173")
    reset_link = f"{frontend_base}/reset-password?token={token}"

    send_reset_email(user.email, reset_link)

    return {"message": "If the email exists, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(data: PasswordResetPayload, db: Session = Depends(get_db)):
    print("RESET PASSWORD ENDPOINT HIT")
    print("TOKEN RAW:", repr(data.token))

    token = data.token
    new_password = data.new_password

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(400, "Invalid token")
    except JWTError:
        raise HTTPException(400, "Invalid or expired token")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    if not new_password or len(new_password) < 4:
        raise HTTPException(400, "Password too short")

    user.password_hash = hash_password(new_password)

    db.commit()

    return {"message": "Password has been reset successfully"}
