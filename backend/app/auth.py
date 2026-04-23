from datetime import datetime, timedelta
from typing import Callable

from fastapi import Depends, HTTPException, status, APIRouter
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from .database import get_db, SessionLocal
from . import models
from app.utils import hash_password, verify_password


# ============================================================
# CONFIG
# ============================================================

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

SECRET_KEY = "twoj-sekret"  # TODO: zmień na bezpieczny
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# ============================================================
# JWT TOKEN — ACCESS TOKEN
# ============================================================

def create_access_token(user: models.User) -> str:
    payload = {
        "sub": user.username,
        "role": user.role,
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ============================================================
# JWT TOKEN — RESET TOKEN
# ============================================================

def create_reset_token(user_id: int) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(hours=1),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ============================================================
# CURRENT USER
# ============================================================

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


# ============================================================
# ROLE CHECKING
# ============================================================

def require_role(required: str) -> Callable:
    """
    Hierarchia ról:
    user < compat < manager < admin
    """
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


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(prefix="/auth", tags=["auth"])


# ============================================================
# LOGIN
# ============================================================

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


# ============================================================
# DEFAULT ADMIN CREATION
# ============================================================

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


# ============================================================
# 🔥 REQUEST PASSWORD RESET
# ============================================================

@router.post("/request-password-reset")
def request_password_reset(email: str, db: Session = Depends(get_db)):
    """
    Użytkownik podaje email → generujemy token → zwracamy link resetujący.
    (Email wyślemy później — teraz tylko mock)
    """

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(404, "Email not found")

    token = create_reset_token(user.id)

    reset_link = f"http://frontend/reset-password?token={token}"

    # MOCK — prawdziwy email dodamy później
    print("====================================")
    print("RESET PASSWORD LINK:")
    print(reset_link)
    print("====================================")

    return {"message": "Reset link generated", "reset_link": reset_link}


# ============================================================
# 🔥 RESET PASSWORD
# ============================================================

@router.post("/reset-password")
def reset_password(token: str, new_password: str, db: Session = Depends(get_db)):
    """
    Użytkownik wysyła token + nowe hasło.
    Token zawiera user_id → ustawiamy nowe hasło.
    """

    # 1. Dekodowanie tokenu
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(400, "Invalid token")
    except JWTError:
        raise HTTPException(400, "Invalid or expired token")

    # 2. Pobranie użytkownika
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    # 3. Walidacja hasła
    if not new_password or len(new_password) < 4:
        raise HTTPException(400, "Password too short")

    # 4. Hashowanie nowego hasła (Argon2)
    user.password_hash = hash_password(new_password)

    db.commit()

    return {"message": "Password has been reset successfully"}
