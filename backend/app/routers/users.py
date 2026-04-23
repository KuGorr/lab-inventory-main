from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..auth import require_role
from app.utils import hash_password

router = APIRouter(prefix="/users", tags=["users"])


# ============================================================
# GET ALL USERS (ADMIN ONLY)
# ============================================================

@router.get("/", response_model=list[schemas.UserRead])
def list_users(db: Session = Depends(get_db), user=Depends(require_role("admin"))):
    return db.query(models.User).all()


# ============================================================
# CREATE USER (ADMIN ONLY)
# ============================================================

@router.post("/", response_model=schemas.UserRead)
def create_user(data: schemas.UserCreate, db: Session = Depends(get_db), user=Depends(require_role("admin"))):

    existing = db.query(models.User).filter(models.User.username == data.username).first()
    if existing:
        raise HTTPException(400, "User already exists")

    # email must be unique if provided
    if data.email:
        email_exists = db.query(models.User).filter(models.User.email == data.email).first()
        if email_exists:
            raise HTTPException(400, "Email already in use")

    new_user = models.User(
        username=data.username,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
        is_admin=(data.role == "admin")
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# ============================================================
# DELETE USER (ADMIN ONLY)
# ============================================================

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), user=Depends(require_role("admin"))):

    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")

    db.delete(u)
    db.commit()
    return {"status": "deleted", "user_id": user_id}


# ============================================================
# UPDATE USER ROLE (ADMIN ONLY)
# ============================================================

@router.patch("/{user_id}/role", response_model=schemas.UserRead)
def update_user_role(
    user_id: int,
    new_role: str,
    db: Session = Depends(get_db),
    user=Depends(require_role("admin"))
):

    valid_roles = ["user", "compat", "manager", "admin"]
    if new_role not in valid_roles:
        raise HTTPException(400, f"Invalid role. Valid roles: {valid_roles}")

    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")

    u.role = new_role
    u.is_admin = (new_role == "admin")

    db.commit()
    db.refresh(u)
    return u


# ============================================================
# CHANGE USER PASSWORD (ADMIN ONLY)
# ============================================================

@router.patch("/{user_id}/password")
def change_user_password(
    user_id: int,
    new_password: str,
    db: Session = Depends(get_db),
    user=Depends(require_role("admin"))
):
    """
    Admin changes password of any user.
    """

    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")

    if not new_password or len(new_password) < 4:
        raise HTTPException(400, "New password is too short")

    u.password_hash = hash_password(new_password)

    db.commit()
    return {"status": "password_changed", "user_id": user_id}


# ============================================================
# UPDATE USER EMAIL (ADMIN ONLY)
# ============================================================

@router.patch("/{user_id}/email", response_model=schemas.UserRead)
def update_user_email(
    user_id: int,
    new_email: str,
    db: Session = Depends(get_db),
    user=Depends(require_role("admin"))
):

    if not new_email or "@" not in new_email:
        raise HTTPException(400, "Invalid email")

    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")

    # check if email already used
    existing = db.query(models.User).filter(models.User.email == new_email).first()
    if existing and existing.id != user_id:
        raise HTTPException(400, "Email already in use")

    u.email = new_email

    db.commit()
    db.refresh(u)
    return u
