from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc
from typing import Optional
import math

from database import get_db
import models
import schemas

router = APIRouter(prefix="/users", tags=["Users"])


def get_user_or_404(user_id: int, db: Session):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"Користувача з id={user_id} не знайдено")
    return user


@router.get("/", response_model=schemas.PaginatedResponse, summary="Список користувачів")
def list_users(
    page: int = Query(1, ge=1, description="Номер сторінки"),
    per_page: int = Query(10, ge=1, le=100, description="Кількість на сторінці"),
    sort_by: str = Query("id", enum=["id", "username", "email", "created_at"], description="Поле сортування"),
    order: str = Query("asc", enum=["asc", "desc"], description="Порядок сортування"),
    search: Optional[str] = Query(None, description="Пошук за username або email"),
    is_active: Optional[bool] = Query(None, description="Фільтр за активністю"),
    db: Session = Depends(get_db),
):
    query = db.query(models.User)

    if search:
        query = query.filter(
            (models.User.username.ilike(f"%{search}%")) |
            (models.User.email.ilike(f"%{search}%"))
        )
    if is_active is not None:
        query = query.filter(models.User.is_active == is_active)

    sort_col = getattr(models.User, sort_by)
    query = query.order_by(asc(sort_col) if order == "asc" else desc(sort_col))

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": math.ceil(total / per_page) if total else 0,
        "items": [schemas.UserResponse.model_validate(u) for u in items],
    }


@router.get("/{user_id}", response_model=schemas.UserWithPosts, summary="Отримати користувача")
def get_user(user_id: int, db: Session = Depends(get_db)):
    return get_user_or_404(user_id, db)


@router.post("/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED, summary="Створити користувача")
def create_user(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email вже використовується")
    if db.query(models.User).filter(models.User.username == payload.username).first():
        raise HTTPException(status_code=409, detail="Username вже використовується")

    user = models.User(**payload.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=schemas.UserResponse, summary="Оновити користувача")
def update_user(user_id: int, payload: schemas.UserUpdate, db: Session = Depends(get_db)):
    user = get_user_or_404(user_id, db)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Видалити користувача")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = get_user_or_404(user_id, db)
    db.delete(user)
    db.commit()

@router.get("/{user_id}/posts", response_model=schemas.PaginatedResponse, summary="Пости користувача")
def get_user_posts(
    user_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    published: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    get_user_or_404(user_id, db)

    query = db.query(models.Post).filter(models.Post.author_id == user_id)
    if published is not None:
        query = query.filter(models.Post.published == published)

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": math.ceil(total / per_page) if total else 0,
        "items": [schemas.PostResponse.model_validate(p) for p in items],
    }