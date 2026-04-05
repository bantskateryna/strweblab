from database import SessionLocal, engine, Base
import models

Base.metadata.create_all(bind=engine)

db = SessionLocal()

db.query(models.Comment).delete()
db.query(models.Post).delete()
db.query(models.User).delete()
db.commit()

users = [
    models.User(username="Andriy A", email="ivan@example.com", full_name="Андрій А"),
    models.User(username="Anastasia B", email="olena@example.com", full_name="Анастасія Б"),
    models.User(username="Victoria C", email="mykola@example.com", full_name="Вікторія С"),
]
db.add_all(users)
db.commit()
for u in users:
    db.refresh(u)

posts = [
    models.Post(title="Вступ", content="FastAPI — сучасний фреймворк для Python...", published=True, author_id=users[0].id),
    models.Post(title="Розділ 1.", content="SQLAlchemy надає потужні інструменти...", published=True, author_id=users[0].id),
    models.Post(title="Розділ 2.", content="Pydantic використовується для перевірки даних...", published=False, author_id=users[1].id),
    models.Post(title="Розділ 3.", content="Порівняння двох підходів до побудови API...", published=True, author_id=users[2].id),
]
db.add_all(posts)
db.commit()
for p in posts:
    db.refresh(p)

comments = [
    models.Comment(content="Чудово!", author_id=users[1].id, post_id=posts[0].id),
    models.Comment(content="Дуже корисно.", author_id=users[2].id, post_id=posts[0].id),
    models.Comment(content="Можна додати приклад?", author_id=users[0].id, post_id=posts[1].id),
    models.Comment(content="Погоджуюся з автором!", author_id=users[1].id, post_id=posts[3].id),
]
db.add_all(comments)
db.commit()

db.close()
print("Тестові дані успішно додано!")
print(f"   Користувачів: {len(users)}")
print(f"   Постів: {len(posts)}")
print(f"   Коментарів: {len(comments)}")