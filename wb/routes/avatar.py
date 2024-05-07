import typing as t
from http import HTTPStatus

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.db import get_db_session
from wb.utils.photo import IMAGE_SIZES, get_photo_path

__all__ = ('router',)

DEFAULT_SIZE = 200


router = APIRouter(prefix='/avatar', tags=['avatar'])


class AvatarSearchParams(BaseModel):
    id: int | None = None
    email: EmailStr | None = None
    pararam: str | None = None
    size: int = Query(default=DEFAULT_SIZE)

    @field_validator('size')
    # pylint: disable-next=no-self-argument
    def validate_size(cls, field_value: int) -> int:
        if field_value not in IMAGE_SIZES:
            return DEFAULT_SIZE
        return field_value

    def get_employee_filter(self) -> t.Any:
        if self.id:
            return m.Employee.id == self.id
        if self.email:
            return m.Employee.email == self.email
        if self.pararam:
            return m.Employee.pararam == self.pararam
        raise ValueError('no search field found')


@router.get('', response_model=None)
async def get_avatar(
    query: AvatarSearchParams = Depends(AvatarSearchParams),
    session: AsyncSession = Depends(get_db_session),
) -> RedirectResponse:
    try:
        flt = query.get_employee_filter()
    except ValueError as err:
        raise HTTPException(HTTPStatus.BAD_REQUEST, detail='filter not found') from err
    emp: m.Employee | None = await session.scalar(sa.select(m.Employee).where(flt))
    if not emp:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='employee not found')
    if not emp.photo:
        raise HTTPException(HTTPStatus.NOT_FOUND, detail='photo not found')
    return RedirectResponse(f'/storage/{get_photo_path(emp.photo, size=query.size)}')
