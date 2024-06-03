import hashlib
from datetime import datetime
from typing import TYPE_CHECKING

import bcrypt
import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from wb.db import BaseDBModel

if TYPE_CHECKING:
    from wb.models.employee import Employee

__all__ = ('EmployeeTM',)


class EmployeeTM(BaseDBModel):
    __tablename__ = 'employee__tm'
    employee_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'employees.id', name='employee__tm_employee_id_fkey', ondelete='CASCADE'
        ),
        primary_key=True,
    )
    employee: Mapped['Employee'] = relationship(
        foreign_keys=[employee_id], lazy='selectin', back_populates='tm'
    )
    last_logon: Mapped[datetime | None]
    key_hash: Mapped[str]

    @staticmethod
    def hash_key(key: str) -> str:
        md5_hash = hashlib.md5(key.encode('utf-8')).hexdigest().encode('utf-8')  # nosec hashlib
        return bcrypt.hashpw(md5_hash, bcrypt.gensalt()).decode('utf-8')

    def set_key(self, key: str) -> None:
        self.key_hash = self.hash_key(key)

    def check_key_md5(self, key_md5: str) -> bool:
        return bcrypt.checkpw(key_md5.encode('utf-8'), self.key_hash.encode('utf-8'))

    def check_key(self, key: str) -> bool:
        return self.check_key_md5(hashlib.md5(key.encode('utf-8')).hexdigest())  # nosec hashlib
