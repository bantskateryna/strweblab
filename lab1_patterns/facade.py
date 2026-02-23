class AuthService:
    def validate_token(self, token: str) -> bool:
        print(f"  [Auth] Checking token...")
        return token.startswith("User ")

class Cache:
    def __init__(self):
        self._store: dict = {}

    def get(self, key: str):
        return self._store.get(key)

    def set(self, key: str, value):
        self._store[key] = value
        print(f"  [Cache] Saved: {key}")

class Database:
    def query(self, sql: str) -> list:
        print(f"  [DB] Query: {sql}")
        return [{"id": 1, "name": "Oleh"}, {"id": 2, "name": "Maria"}]

class Logger:
    def log(self, msg: str):
        print(f"  [Log] {msg}")


class ApiService:
    def __init__(self):
        self._auth = AuthService()
        self._cache = Cache()
        self._db = Database()
        self._log = Logger()

    def get_users(self, token: str) -> list | None:
        if not self._auth.validate_token(token):
            self._log.log("Access denied")
            return None

        cached = self._cache.get("users")
        if cached:
            self._log.log("Returned from cache")
            return cached

        users = self._db.query("SELECT * FROM users")
        self._cache.set("users", users)
        self._log.log(f"Returned {len(users)} users")
        return users

api = ApiService()

users = api.get_users("User abc123")
print(f"Result: {users}\n")

users = api.get_users("User abc123")

print("\nInvalid token")
api.get_users("invalid")
