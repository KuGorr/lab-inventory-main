from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from datetime import datetime, timedelta

from .. import models, schemas
from ..database import SessionLocal
from ..utils import hash_password, verify_password
from ..auth import create_access_token

SECRET_KEY = "supersecretkey123"
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

# -------------------------
# DB SESSION
# -------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------------
# CURRENT USER
# -------------------------

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception

    return user


# -------------------------
# REGISTER
# -------------------------

@router.post("/register", response_model=schemas.UserRead)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    new_user = models.User(
        username=user.username,
        password_hash=hash_password(user.password),
        is_admin=False
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# -------------------------
# LOGIN
# -------------------------

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    # Na razie logowanie tylko po username (email dodamy później)
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


# -------------------------
# ME
# -------------------------

@router.get("/me", response_model=schemas.UserRead)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user


# ============================================================
# 🔥 RESET PASSWORD — KROK 1: REQUEST RESET LINK
# ============================================================

def create_reset_token(user_id: int):
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/request-password-reset")
def request_password_reset(email: str, db: Session = Depends(get_db)):
    """
    Użytkownik podaje email → generujemy token → wysyłamy link resetujący.
    (Na razie wysyłka emaila jest mockiem — dodamy później)
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
