from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional
import math

from database import get_db
import models
import schemas

router = APIRouter(prefix="/comments", tags=["Comments"])


def get_comment_or_404(comment_id: int, db: Session):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail=f"Коментар з id={comment_id} не знайдено")
    return comment


@router.get("/", response_model=schemas.PaginatedResponse, summary="Список коментарів")
def list_comments(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    author_id: Optional[int] = Query(None, description="Фільтр за автором"),
    post_id: Optional[int] = Query(None, description="Фільтр за постом"),
    db: Session = Depends(get_db),
):
    query = db.query(models.Comment)

    if author_id is not None:
        query = query.filter(models.Comment.author_id == author_id)
    if post_id is not None:
        query = query.filter(models.Comment.post_id == post_id)

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": math.ceil(total / per_page) if total else 0,
        "items": [schemas.CommentResponse.model_validate(c) for c in items],
    }


@router.get("/{comment_id}", response_model=schemas.CommentWithDetails, summary="Отримати коментар")
def get_comment(comment_id: int, db: Session = Depends(get_db)):
    return get_comment_or_404(comment_id, db)


@router.post("/", response_model=schemas.CommentResponse, status_code=status.HTTP_201_CREATED, summary="Створити коментар")
def create_comment(payload: schemas.CommentCreate, db: Session = Depends(get_db)):
    if not db.query(models.User).filter(models.User.id == payload.author_id).first():
        raise HTTPException(status_code=404, detail="Автора не знайдено")
    if not db.query(models.Post).filter(models.Post.id == payload.post_id).first():
        raise HTTPException(status_code=404, detail="Пост не знайдено")

    comment = models.Comment(**payload.model_dump())
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.put("/{comment_id}", response_model=schemas.CommentResponse, summary="Оновити коментар")
def update_comment(comment_id: int, payload: schemas.CommentUpdate, db: Session = Depends(get_db)):
    comment = get_comment_or_404(comment_id, db)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(comment, field, value)

    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Видалити коментар")
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    comment = get_comment_or_404(comment_id, db)
    db.delete(comment)
    db.commit()