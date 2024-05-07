from typing import Any

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.db import get_db_session
from wb.schemas import (
    BaseModelIdOutput,
    BasePayloadOutput,
    ConfluenceAPIParams,
    ConfluenceSearchParams,
    HelpCenterAttachmentCreate,
    HelpCenterAttachmentOut,
    SelectField,
    SelectOutput,
)
from wb.services.confluence import confluence_api
from wb.services.youtrack.youtrack import YoutrackProcessor
from wb.utils.current_user import current_employee
from wb.utils.query import make_id_output, make_select_output, make_success_output
from wb.utils.transform import transform_youtrack_project_field

__all__ = ('router',)


router = APIRouter(prefix='/api/v1/help-center', tags=['v1', 'help-center'])


@router.get('/search')
async def list_articles(
    params: ConfluenceSearchParams = Depends(ConfluenceSearchParams),
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[Any]:
    q = sa.select(m.Portal).where(m.Portal.is_active.is_(True))
    if params.portal_id:
        q = sa.select(m.Portal).where(m.Portal.id == params.portal_id)
    portals = await session.scalars(q)
    space_keys = [portal.confluence_space_keys for portal in portals.all()]
    raw_results: dict | None = await confluence_api.search(params, space_keys)
    results: dict = raw_results or {'results': []}
    return make_success_output(payload=results)


@router.get('/confluence/space/list')
async def list_space(
    query: ConfluenceAPIParams = Depends(ConfluenceAPIParams),
) -> BasePayloadOutput[Any]:
    results = await confluence_api.list_space(params=query)
    return make_success_output(payload=results)


@router.get('/confluence/space/select')
async def space_select(
    query: ConfluenceAPIParams = Depends(ConfluenceAPIParams),
) -> SelectOutput:
    space_list_results = await confluence_api.list_space(params=query)
    results = space_list_results['results']
    return make_select_output(
        items=[SelectField(label=obj['name'], value=obj['key']) for obj in results]
    )


@router.get('/youtrack/project/list')
async def list_project(
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[Any]:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    youtrack_processor = YoutrackProcessor(session=session)
    fields = ['id', 'name', 'shortName']
    results = youtrack_processor.list_project(fields=fields)
    return make_success_output(payload=results)


@router.get('/youtrack/project/select')
async def project_select(
    session: AsyncSession = Depends(get_db_session),
) -> SelectOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    youtrack_processor = YoutrackProcessor(session=session)
    fields = ['id', 'name', 'shortName']
    results = youtrack_processor.list_project(fields=fields)
    return make_select_output(
        items=[
            SelectField(label=obj['name'], value=obj['shortName']) for obj in results
        ]
    )


@router.get('/youtrack/project/{project_id}/fields')
async def get_project_fields(
    project_id: str,
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[Any]:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    youtrack_processor = YoutrackProcessor(session=session)
    fields = ['id', 'field(id,name,fieldDefaults(defaultValues(id,name)))']
    raw_results = youtrack_processor.get_project_fields(
        project_id=project_id, fields=fields
    )
    results = [transform_youtrack_project_field(obj) for obj in raw_results]
    return make_success_output(payload=results)


@router.get('/attachments/list')
async def list_attachments(
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[HelpCenterAttachmentOut]:
    q = sa.select(m.HelpCenterAttachment)
    results = await session.scalars(q)
    return make_success_output(
        payload=[HelpCenterAttachmentOut.from_obj(obj) for obj in results.all()],
    )


@router.post('/attachments')
async def create_attachment(
    body: HelpCenterAttachmentCreate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    try:
        obj = m.HelpCenterAttachment(url=body.url, type=body.type)
        session.add(obj)
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(409, detail='duplicate') from err
    return make_id_output(obj.id)


@router.delete('/attachments/{attachment_id}')
async def delete_attachment(
    attachment_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    obj: m.HelpCenterAttachment | None = await session.scalar(
        sa.select(m.HelpCenterAttachment).where(
            m.HelpCenterAttachment.id == attachment_id
        )
    )
    if not obj:
        raise HTTPException(404, detail='Attachment not found')
    await session.delete(obj)
    await session.commit()
    return make_id_output(obj.id)
