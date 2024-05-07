from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column
from starsol_otp import TOTP

from shared_utils.sql import EncryptedObject
from wb.config import CONFIG
from wb.db import BaseDBModel

__all__ = ('EmployeeOTP',)


class EmployeeOTP(BaseDBModel):
    __tablename__ = 'employee__otp'
    employee_id: Mapped[int] = mapped_column(
        sa.ForeignKey(
            'employees.id', name='employee__otp_employee_id_fkey', ondelete='CASCADE'
        ),
        primary_key=True,
    )
    secret: Mapped[str] = mapped_column(
        EncryptedObject['str'](str, passphrase=CONFIG.DB_ENCRYPT_KEY)
    )
    digits: Mapped[int] = mapped_column(default=CONFIG.OTP_DIGITS)
    period: Mapped[int] = mapped_column(default=CONFIG.OTP_PERIOD)
    digest: Mapped[str] = mapped_column(default=CONFIG.OTP_DIGEST)
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )

    def get_verifier(self) -> TOTP:
        return TOTP(
            self.secret,
            digits=self.digits,
            period=self.period,
            digest=self.digest,
        )
