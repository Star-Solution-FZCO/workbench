import bcrypt
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import expression

from wb.db import BaseDBModel

__all__ = ('User',)


class User(BaseDBModel):
    __tablename__ = 'users'
    user_id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(unique=True)
    password_hash: Mapped[str]
    active: Mapped[bool] = mapped_column(server_default=expression.false())

    def check_password(self, password: str) -> bool:
        return bcrypt.checkpw(
            password.encode('utf-8'), self.password_hash.encode('utf-8')
        )

    @staticmethod
    def hash_password(password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def set_password(self, password: str) -> None:
        self.password_hash = self.hash_password(password)
