# pylint: skip-file
# type: ignore
import csv
import hashlib
import io
import pickle
import random
from datetime import datetime
from typing import List, Optional

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import wb.models as m
from wb.db import get_db_session
from wb.redis_db import AsyncRedis, get_redis_session
from wb.schemas import BaseOutput, BasePayloadOutput
from wb.utils.query import make_success_output

__all__ = ('router',)

router = APIRouter(prefix='/api/v1/admin/import', tags=['v1', 'admin', 'import'])

CSV_ID_FIELD = 'email'
CSV_FIELD_NAMES_OPTIONAL = ('english_name',)


class ImportChangeItemT(BaseModel):
    field: str
    before: str
    after: str


class ImportChangeEmployeeT(BaseModel):
    id: int
    label: str
    changes: List[ImportChangeItemT]


class ImportPayloadT(BaseModel):
    id: Optional[str]
    status: str
    errors: List[str]
    changes: List[ImportChangeEmployeeT]


@router.post('')
async def start_import(
    file: UploadFile,
    session: AsyncSession = Depends(get_db_session),
    redis: AsyncRedis = Depends(get_redis_session),
) -> BasePayloadOutput[ImportPayloadT]:
    try:
        buffer = io.StringIO(file.file.read().decode('utf-8'))
    except Exception as err:
        raise HTTPException(422, detail='failed to read file')
    reader = csv.DictReader(buffer)
    if CSV_ID_FIELD not in reader.fieldnames:
        return make_success_output(
            payload=ImportPayloadT(
                status='failed',
                changes=[],
                errors=[f'mandatory field "{CSV_ID_FIELD}" not found'],
            )
        )
    errors = []
    output_changes = []
    changes = {}
    for row in reader:
        email = row['email'].strip()
        user = await session.scalar(
            sa.select(m.Employee)
            .where(m.Employee.email == email)
            .options(
                selectinload(m.Employee.managers),
                selectinload(m.Employee.mentors),
                selectinload(m.Employee.team),
                selectinload(m.Employee.watchers),
            )
        )
        if not user:
            errors.append(f'user with email="{email}" not found, skipped')
            continue
        if user.id in changes:
            errors.append(
                f'user with email="{email}" is duplicated, use only first appearance'
            )
            continue
        changes[user.id] = []
        user_output_changes = []
        for k, v in row.items():
            v = v.strip()
            if k in (
                'english_name',
                'native_name',
                'public_contacts',
                'team_position',
            ):
                if user.__getattribute__(k) != v:
                    changes[user.id].append((k, v))
                    user_output_changes.append(
                        ImportChangeItemT(
                            field=k,
                            before=(
                                user.__getattribute__(k)
                                if user.__getattribute__(k)
                                else ''
                            ),
                            after=v,
                        )
                    )
                continue
            if k in (
                'position',
                'organization',
                'team',
                'cooperation_type',
            ):
                if k == 'position':
                    field_class = m.Position
                elif k == 'organization':
                    field_class = m.Organization
                elif k == 'cooperation_type':
                    field_class = m.CooperationType
                else:
                    field_class = m.Team
                if not v:
                    new_val = None
                elif not (
                    new_val := await session.scalar(
                        sa.select(field_class).where(field_class.name == v)
                    )
                ):
                    errors.append(
                        f'{k} "{v}" not found for user with email="{email}", skipped {k} change'
                    )
                    continue
                old_val = user.__getattribute__(k)
                if (
                    (old_val and new_val and old_val.id != new_val.id)
                    or (not old_val and new_val)
                    or (old_val and not new_val)
                ):
                    changes[user.id].append((k, new_val.id if new_val else None))
                    user_output_changes.append(
                        ImportChangeItemT(
                            field=k, before=old_val.name if old_val else '', after=v
                        )
                    )
                continue
            if k in (
                'managers',
                'mentors',
            ):
                new_list = []
                skip_flag = False
                changes_flag = False
                old_ids = [m_user.id for m_user in getattr(user, k)]
                for m_email in filter(
                    lambda s: s, map(lambda s: s.strip(), v.split(' '))
                ):
                    if not (
                        emp := await session.scalar(
                            sa.select(m.Employee).where(m.Employee.email == m_email)
                        )
                    ):
                        errors.append(
                            f'{k} with email "{m_email}" not found for user with email="{email}", skipped {k} change'
                        )
                        skip_flag = True
                        continue
                    new_list.append(emp)
                    if emp.id not in old_ids:
                        changes_flag = True
                if skip_flag:
                    continue
                if changes_flag or len(old_ids) != len(new_list):
                    after_str = ','.join([str(u.id) for u in new_list])
                    changes[user.id].append((k, after_str))
                    user_output_changes.append(
                        ImportChangeItemT(
                            field=k,
                            before=','.join([str(uid) for uid in old_ids]),
                            after=after_str,
                        )
                    )
                continue
            if k in (
                'work_started',
                'birthday',
                'contract_date',
            ):
                new_date = datetime.strptime(v, '%d %b %Y').date() if v else None
                old_date = user.__getattribute__(k)
                if old_date != new_date:
                    changes[user.id].append((k, v))
                    user_output_changes.append(
                        ImportChangeItemT(
                            field=k,
                            before=old_date.strftime('%d %b %Y') if old_date else '',
                            after=v,
                        )
                    )
                continue
        if user_output_changes:
            output_changes.append(
                ImportChangeEmployeeT(
                    id=user.id,
                    label=f'{user.english_name} ({user.email})',
                    changes=user_output_changes,
                )
            )
    import_id = None
    status = 'no-changes'
    if output_changes:
        status = 'ok'
        import_id = hashlib.sha1(
            f'{datetime.utcnow()}-{file.filename}-{random.random()}'.encode(),  # nosec random
            usedforsecurity=False,
        ).hexdigest()
        await redis.set(f'import-{import_id}', pickle.dumps(changes))
    return make_success_output(
        payload=ImportPayloadT(
            id=import_id,
            status=status,
            errors=errors,
            changes=output_changes,
        )
    )


@router.put('/{id}/approve')
async def approve_import(
    id: str,
    session: AsyncSession = Depends(get_db_session),
    redis: AsyncRedis = Depends(get_redis_session),
) -> BaseOutput:
    packed_changes = await redis.get(f'import-{id}')
    changes = pickle.loads(packed_changes)  # nosec pickle
    for uid, user_change in changes.items():
        user: Optional['m.Employee'] = await session.scalar(
            sa.select(m.Employee)
            .where(m.Employee.id == uid)
            .options(
                selectinload(m.Employee.managers),
                selectinload(m.Employee.mentors),
                selectinload(m.Employee.team),
                selectinload(m.Employee.watchers),
            )
        )
        if not user:
            continue
        for k, v in user_change:
            if k in (
                'english_name',
                'native_name',
                'public_contacts',
                'team_position',
            ):
                user.__setattr__(k, v)
                continue
            if k == 'team':
                if not v:
                    team = None
                elif not (
                    team := await session.scalar(
                        sa.select(m.Team).where(m.Team.id == v)
                    )
                ):
                    continue
                user.team = team
                continue
            if k == 'organization':
                if not v:
                    org = None
                elif not (
                    org := await session.scalar(
                        sa.select(m.Organization).where(m.Organization.id == v)
                    )
                ):
                    continue
                user.organization = org
                continue
            if k == 'position':
                if not v:
                    pos = None
                elif not (
                    pos := await session.scalar(
                        sa.select(m.Position).where(m.Position.id == v)
                    )
                ):
                    continue
                user.position = pos
                continue
            if k == 'cooperation_type':
                if not v:
                    coop_type = None
                elif not (
                    coop_type := await session.scalar(
                        sa.select(m.CooperationType).where(m.CooperationType.id == v)
                    )
                ):
                    continue
                user.cooperation_type = coop_type
                continue
            if k in (
                'managers',
                'mentors',
            ):
                new_list = []
                if v:
                    for uid in map(lambda s: int(s), v.split(',')):
                        if m_user := await session.scalar(
                            sa.select(m.Employee).where(m.Employee.id == v)
                        ):
                            new_list.append(m_user)
                user.__setattr__(k, new_list)
                continue
            if k in (
                'work_started',
                'birthday',
                'contract_date',
            ):
                user.__setattr__(
                    k, datetime.strptime(v, '%d %b %Y').date() if v else None
                )
                continue
    await session.commit()
    return BaseOutput(success=True)
