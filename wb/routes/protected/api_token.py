from datetime import datetime
from http import HTTPStatus
from typing import Self

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.db import get_db_session
from wb.schemas import BasePayloadOutput
from wb.utils.query import make_success_output

from ._auth import protected_auth_dependency

__all__ = ('router',)

router = APIRouter(
    prefix='/api/protected/api-token',
    tags=['protected', 'otp'],
    dependencies=[protected_auth_dependency],
)


class APITokenCreate(BaseModel):
    name: str
    employee_id: int
    expires_in: int | None = None


class APITokenCreatedOut(BaseModel):
    token: str

    @classmethod
    def from_obj(cls, obj: 'm.APIToken') -> Self:
        return cls(token=obj.token)


@router.post('')
async def create_api_token(
    body: APITokenCreate,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[APITokenCreatedOut]:
    emp = await session.scalar(
        sa.select(m.Employee).where(m.Employee.id == body.employee_id)
    )
    if not emp:
        raise HTTPException(HTTPStatus.NOT_FOUND, 'Employee not found')
    obj = m.APIToken.create(
        name=body.name,
        owner=emp,
        created=datetime.utcnow(),
        expires_in=body.expires_in,
    )
    session.add(obj)
    await session.commit()
    return make_success_output(payload=APITokenCreatedOut.from_obj(obj))
