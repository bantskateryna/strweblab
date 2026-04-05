from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime



class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, example="john_doe")
    email: str = Field(..., example="john@example.com")
    full_name: Optional[str] = Field(None, max_length=100, example="John Doe")


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[str] = None
    full_name: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserWithPosts(UserResponse):
    posts: List["PostResponse"] = []

    class Config:
        from_attributes = True


class PostBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200, example="Мій перший пост")
    content: str = Field(..., min_length=10, example="Зміст посту...")
    published: bool = Field(default=False)


class PostCreate(PostBase):
    author_id: int = Field(..., example=1)


class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    content: Optional[str] = Field(None, min_length=10)
    published: Optional[bool] = None


class PostResponse(PostBase):
    id: int
    author_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PostWithDetails(PostResponse):
    author: UserResponse
    comments: List["CommentResponse"] = []

    class Config:
        from_attributes = True


class CommentBase(BaseModel):
    content: str = Field(..., min_length=1, example="Чудовий пост!")


class CommentCreate(CommentBase):
    author_id: int = Field(..., example=1)
    post_id: int = Field(..., example=1)


class CommentUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1)


class CommentResponse(CommentBase):
    id: int
    author_id: int
    post_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CommentWithDetails(CommentResponse):
    author: UserResponse
    post: PostResponse

    class Config:
        from_attributes = True

class PaginatedResponse(BaseModel):
    total: int
    page: int
    per_page: int
    pages: int
    items: list


UserWithPosts.model_rebuild()
PostWithDetails.model_rebuild()