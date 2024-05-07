from datetime import datetime
from typing import Self

from pydantic import BaseModel

import wb.models as m
from wb.config import CONFIG
from wb.constants import OTP_NAME

__all__ = (
    'OTPWithSecretOut',
    'OTPOut',
)


class OTPOut(BaseModel):
    created: datetime

    @classmethod
    def from_obj(cls, obj: m.EmployeeOTP) -> Self:
        return cls(
            created=obj.created,
        )


class OTPWithSecretOut(BaseModel):
    created: datetime
    secret: str
    link: str
    period: int
    digits: int
    digest: str

    @classmethod
    def from_obj(cls, obj: m.EmployeeOTP) -> Self:
        return cls(
            created=obj.created,
            secret=obj.secret,
            link=obj.get_verifier().url(OTP_NAME, issuer=CONFIG.OTP_ISSUER),
            period=obj.period,
            digits=obj.digits,
            digest=obj.digest,
        )
