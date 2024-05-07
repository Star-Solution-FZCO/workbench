from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from shared_utils.sql import EncryptedObject
from wb.config import CONFIG
from wb.db import BaseDBModel

__all__ = ('EmployeeTM',)


class EmployeeTM(BaseDBModel):
    __tablename__ = 'employee__tm'
    employee_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'employees.id', name='employee__tm_employee_id_fkey', ondelete='CASCADE'
        ),
        primary_key=True,
    )
    last_logon: Mapped[datetime | None]
    key: Mapped[str] = mapped_column(
        EncryptedObject['str'](str, passphrase=CONFIG.DB_ENCRYPT_KEY)
    )
