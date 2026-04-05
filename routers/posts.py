from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc
from typing import Optional
import math

from database import get_db
import models
import schemas

router = APIRouter(prefix="/posts", tags=["Posts"])


def get_post_or_404(post_id: int, db: Session):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail=f"Пост з id={post_id} не знайдено")
    return post


@router.get("/", response_model=schemas.PaginatedResponse, summary="Список постів")
def list_posts(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    sort_by: str = Query("created_at", enum=["id", "title", "created_at"]),
    order: str = Query("desc", enum=["asc", "desc"]),
    search: Optional[str] = Query(None, description="Пошук у заголовку"),
    published: Optional[bool] = Query(None, description="Фільтр за публікацією"),
    author_id: Optional[int] = Query(None, description="Фільтр за автором"),
    db: Session = Depends(get_db),
):
    query = db.query(models.Post)

    if search:
        query = query.filter(models.Post.title.ilike(f"%{search}%"))
    if published is not None:
        query = query.filter(models.Post.published == published)
    if author_id is not None:
        query = query.filter(models.Post.author_id == author_id)

    sort_col = getattr(models.Post, sort_by)
    query = query.order_by(asc(sort_col) if order == "asc" else desc(sort_col))

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": math.ceil(total / per_page) if total else 0,
        "items": [schemas.PostResponse.model_validate(p) for p in items],
    }


@router.get("/{post_id}", response_model=schemas.PostWithDetails, summary="Отримати пост")
def get_post(post_id: int, db: Session = Depends(get_db)):
    return get_post_or_404(post_id, db)


@router.post("/", response_model=schemas.PostResponse, status_code=status.HTTP_201_CREATED, summary="Створити пост")
def create_post(payload: schemas.PostCreate, db: Session = Depends(get_db)):
    author = db.query(models.User).filter(models.User.id == payload.author_id).first()
    if not author:
        raise HTTPException(status_code=404, detail="Автора не знайдено")

    post = models.Post(**payload.model_dump())
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@router.put("/{post_id}", response_model=schemas.PostResponse, summary="Оновити пост")
def update_post(post_id: int, payload: schemas.PostUpdate, db: Session = Depends(get_db)):
    post = get_post_or_404(post_id, db)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(post, field, value)

    db.commit()
    db.refresh(post)
    return post


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Видалити пост")
def delete_post(post_id: int, db: Session = Depends(get_db)):
    post = get_post_or_404(post_id, db)
    db.delete(post)
    db.commit()


@router.get("/{post_id}/comments", response_model=schemas.PaginatedResponse, summary="Коментарі посту")
def get_post_comments(
    post_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    get_post_or_404(post_id, db)

    query = db.query(models.Comment).filter(models.Comment.post_id == post_id)
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": math.ceil(total / per_page) if total else 0,
        "items": [schemas.CommentResponse.model_validate(c) for c in items],
    }