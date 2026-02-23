from dataclasses import dataclass, field

@dataclass
class Query:
    table: str = ""
    columns: list[str] = field(default_factory=list)
    conditions: list[str] = field(default_factory=list)
    limit: int = 0

    def to_sql(self) -> str:
        cols = ", ".join(self.columns) or "*"
        sql = f"SELECT {cols} FROM {self.table}"
        if self.conditions:
            sql += f" WHERE {' AND '.join(self.conditions)}"
        if self.limit:
            sql += f" LIMIT {self.limit}"
        return sql


class QueryBuilder:
    def __init__(self):
        self._q = Query()

    def set_table(self, table: str):
        self._q.table = table
        return self

    def add_column(self, *cols: str):
        self._q.columns.extend(cols)
        return self

    def add_where(self, condition: str):
        self._q.conditions.append(condition)
        return self

    def set_limit(self, n: int):
        self._q.limit = n
        return self

    def build(self) -> Query:
        result, self._q = self._q, Query()
        return result


class QueryDirector:
    def __init__(self, builder: QueryBuilder):
        self._b = builder

    def make_active_users(self) -> Query:
        return (self._b
                .set_table("users")
                .add_column("id", "name", "email")
                .add_where("is_active = true")
                .set_limit(100)
                .build())


builder = QueryBuilder()
director = QueryDirector(builder)

print(director.make_active_users().to_sql())

query = (builder
         .set_table("orders")
         .add_where("status = 'pending'")
         .add_where("total > 1000")
         .build())
print(query.to_sql())