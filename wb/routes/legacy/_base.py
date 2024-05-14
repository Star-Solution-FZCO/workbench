import sqlalchemy as sa
from fastapi.datastructures import FormData
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

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


async def auth_tm_user(body: FormData, session: AsyncSession) -> m.Employee | None:
    # pylint: disable=too-many-return-statements
    if not isinstance((login := body.get('login')), str):
        return None
    if not isinstance((password := body.get('password')), str):
        return None
    if not login or not password:
        return None
    user = await session.scalar(
        sa.select(
            m.Employee,
        )
        .where(
            m.Employee.account == login,
        )
        .options(selectinload(m.Employee.tm))
    )
    if not user:
        return None
    if not user.tm:
        return None
    if not user.tm.check_key_md5(password):
        return None
    return user
