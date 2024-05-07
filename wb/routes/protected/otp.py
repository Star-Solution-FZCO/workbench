from typing import Self

import sqlalchemy as sa
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.config import CONFIG
from wb.constants import OTP_NAME
from wb.db import get_db_session
from wb.schemas import BaseListOutput, ListParams
from wb.utils.db import count_select_query_results
from wb.utils.query import make_list_output

from ._auth import protected_auth_dependency

__all__ = ('router',)

router = APIRouter(
    prefix='/api/protected/otp',
    tags=['protected', 'otp'],
    dependencies=[protected_auth_dependency],
)


class OTPListItem(BaseModel):
    email: str
    otp_link: str | None

    @classmethod
    def from_obj(cls, email: str, obj: m.EmployeeOTP | None) -> Self:
        return cls(
            email=email,
            otp_link=(
                obj.get_verifier().url(OTP_NAME, issuer=CONFIG.OTP_ISSUER)
                if obj
                else None
            ),
        )


@router.get('/list')
async def get_otp_list_with_secret(
    query: ListParams = Depends(ListParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[OTPListItem]:
    q = sa.select(m.Employee.email, m.EmployeeOTP).outerjoin(
        m.EmployeeOTP, m.EmployeeOTP.employee_id == m.Employee.id
    )
    cnt = await count_select_query_results(q, session)
    results = await session.execute(
        q.order_by(m.Employee.id).limit(query.limit).offset(query.offset)
    )
    return make_list_output(
        count=cnt,
        limit=query.limit,
        offset=query.offset,
        items=[
            OTPListItem.from_obj(email, otp_obj) for email, otp_obj in results.all()
        ],
    )
