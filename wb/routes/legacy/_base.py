import sqlalchemy as sa
from fastapi.datastructures import FormData
from sqlalchemy.ext.asyncio import AsyncSession

import timetracking.models as tmm
import wb.models as m

__all__ = (
    'HEADERS',
    'auth_tm_user',
)


HEADERS = {
    'Pragma': 'public',
    'Expires': '0',
    'Cache-Control': 'must-revalidate, post-check=0, pre-check=0',
    'Content-Type': 'application/octet-stream',
    'Content-Transfer-Encoding': 'binary',
}


async def auth_tm_user(
    body: FormData, session: AsyncSession, tm_session: AsyncSession
) -> m.Employee | None:
    # pylint: disable=too-many-return-statements
    if not isinstance((login := body.get('login')), str):
        return None
    if not isinstance((password := body.get('password')), str):
        return None
    if not login or not password:
        return None
    user = await tm_session.scalar(
        sa.select(
            tmm.User,
        ).where(
            tmm.User.login == login,
        )
    )
    if not user:
        return None
    if user.password != password:
        return None
    emp = await session.scalar(
        sa.select(
            m.Employee,
        ).where(
            m.Employee.email == user.email,
        )
    )
    return emp
