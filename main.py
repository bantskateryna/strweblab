from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import users, posts, comments
from database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Lab2 REST API",
    description="REST API з сутностями: Користувачі, Пости, Коментарі",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/v1")
app.include_router(posts.router, prefix="/api/v1")
app.include_router(comments.router, prefix="/api/v1")


@app.get("/", tags=["Root"])
def root():
    return {"message": "Lab2 REST API працює!", "docs": "/docs"}