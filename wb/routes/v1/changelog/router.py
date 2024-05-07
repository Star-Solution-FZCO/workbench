from http import HTTPStatus

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.db import get_db_session
from wb.schemas import (
    BaseListOutput,
    BaseModelIdOutput,
    BasePayloadOutput,
    ListFilterParams,
)
from wb.services.notifications import create_inner_notifications
from wb.utils.current_user import current_employee
from wb.utils.db import count_select_query_results
from wb.utils.query import make_id_output, make_list_output, make_success_output
from wb.utils.search import filter_to_query, sort_to_query

from .schemas import ChangelogCreate, ChangelogNameOut, ChangelogOut, ChangelogUpdate

__all__ = ('router',)


router = APIRouter(prefix='/api/v1/changelog', tags=['v1', 'changelog'])


async def create_notifications(session: AsyncSession, changelog: m.Changelog) -> None:
    employees = await session.scalars(
        sa.select(m.Employee).where(m.Employee.active.is_(True))
    )
    recipients: list[int] = [emp.id for emp in employees.all()]
    release_date = changelog.release_date.strftime('%d/%m/%Y')
    subject = f'Workbench v{changelog.name} release ({release_date})'
    await create_inner_notifications(
        session=session,
        recipients=recipients,
        subject=subject,
        content=changelog.content,
        notification_type='new-release',
        show_on_main_page=True,
    )


@router.get('/list')
async def list_changelogs(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[ChangelogOut]:
    q = sa.select(m.Changelog)
    curr_user = current_employee()
    if not curr_user.is_admin:
        q = q.filter(m.Changelog.release_date.isnot(None))
    if query.filter:
        q = q.filter(
            filter_to_query(
                query.filter, m.Changelog, available_fields=['name', 'content']
            )
        )  # type: ignore
    count = await count_select_query_results(q, session=session)
    sorts = (m.Changelog.release_date.desc(),)
    if query.sort_by:
        sorts = sort_to_query(
            m.Changelog,
            query.sort_by,
            direction=query.direction,
            available_sort_fields=['name', 'created', 'release_date'],
        )
    results = await session.scalars(
        q.order_by(*sorts).limit(query.limit).offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[ChangelogOut.from_obj(obj) for obj in results.all()],
    )


@router.get('/list/name')
async def list_changelogs_name(
    session: AsyncSession = Depends(get_db_session),
) -> list[ChangelogNameOut]:
    q = sa.select(m.Changelog)
    curr_user = current_employee()
    if not curr_user.is_admin:
        q = q.filter(m.Changelog.release_date.isnot(None))
    sorts = (m.Changelog.release_date.desc(),)
    results = await session.scalars(q.order_by(*sorts))
    return [ChangelogNameOut.from_obj(obj) for obj in results.all()]


@router.get('/{changelog_id}')
async def get_changelog(
    changelog_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[ChangelogOut]:
    q = sa.select(m.Changelog).where(m.Changelog.id == changelog_id)
    curr_user = current_employee()
    if not curr_user.is_admin:
        q = q.filter(m.Changelog.release_date.isnot(None))
    obj: m.Changelog | None = await session.scalar(q)
    if not obj:
        raise HTTPException(404, detail='Changelog not found')
    return make_success_output(payload=ChangelogOut.from_obj(obj))


@router.post('')
async def create_changelog(
    body: ChangelogCreate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    try:
        changelog = m.Changelog(
            name=body.name, content=body.content, release_date=body.release_date
        )
        session.add(changelog)
        await session.commit()
        if body.release_date is not None:
            await create_notifications(session=session, changelog=changelog)
    except IntegrityError as err:
        raise HTTPException(409, detail='duplicate') from err
    return make_id_output(changelog.id)


@router.put('/{changelog_id}')
async def update_changelog(
    changelog_id: int,
    body: ChangelogUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    changelog: m.Changelog | None = await session.scalar(
        sa.select(m.Changelog).where(m.Changelog.id == changelog_id)
    )
    if not changelog:
        raise HTTPException(404, detail='Changelog not found')
    prev_release_date = changelog.release_date
    data = body.dict(exclude_unset=True)
    if 'name' in data:
        changelog.name = data['name']
    if 'content' in data:
        changelog.content = data['content']
    if 'release_date' in data:
        changelog.release_date = data['release_date']
    if session.is_modified(changelog):
        try:
            await session.commit()
            if prev_release_date is None and data['release_date'] is not None:
                await create_notifications(session=session, changelog=changelog)
        except IntegrityError as err:
            raise HTTPException(409, detail='duplicate') from err
    return make_id_output(changelog.id)


@router.delete('/{changelog_id}')
async def delete_changelog(
    changelog_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    obj: m.Changelog | None = await session.scalar(
        sa.select(m.Changelog).where(m.Changelog.id == changelog_id)
    )
    if not obj:
        raise HTTPException(404, detail='Changelog not found')
    await session.delete(obj)
    await session.commit()
    return make_id_output(obj.id)
