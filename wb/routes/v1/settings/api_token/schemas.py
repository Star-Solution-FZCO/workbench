import typing as t
from datetime import datetime

from pydantic import BaseModel

import wb.models as m
from wb.schemas import BaseOutModel

__all__ = (
    'APITokenOut',
    'APITokenCreate',
    'APITokenCreatedOut',
)


class APITokenOut(BaseModel):
    id: int
    name: str
    created: datetime
    expires_in: int | None
    token_suffix: str

    @classmethod
    def from_obj(cls, obj: m.APIToken) -> t.Self:
        return cls(
            id=obj.id,
            name=obj.name,
            created=obj.created,
            expires_in=obj.expires_in,
            token_suffix=obj.token[-6:],
        )


class APITokenCreate(BaseModel):
    name: str
    expires_in: int | None = None


class APITokenCreatedOut(BaseOutModel[m.APIToken]):
    id: int
    token: str
