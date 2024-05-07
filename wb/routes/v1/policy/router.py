from datetime import datetime
from http import HTTPStatus

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.config import CONFIG
from wb.db import get_db_session
from wb.schemas import (
    BaseListOutput,
    BaseModelIdOutput,
    BasePayloadOutput,
    ListFilterParams,
    SelectFieldInt,
    SelectOutput,
    SelectParams,
)
from wb.services import get_employee_by_id
from wb.services.notifications import (
    Notification,
    NotificationDestinationEmployee,
    NotificationMessage,
)
from wb.utils.current_user import current_employee
from wb.utils.db import count_select_query_results
from wb.utils.diff_html import diff_html
from wb.utils.query import (
    make_id_output,
    make_list_output,
    make_select_output,
    make_success_output,
)
from wb.utils.search import filter_to_query, sort_to_query

from .schemas import (
    EmployeePolicyApproveOut,
    PolicyCreate,
    PolicyDiffOut,
    PolicyEmployeeListExclusionOut,
    PolicyExclusionCreate,
    PolicyOut,
    PolicyRevisionCreate,
    PolicyRevisionOut,
    PolicyRevisionRevisionShorOut,
    PolicyRevisionUpdate,
    PolicyUpdate,
)

__all__ = ('router',)


router = APIRouter(prefix='/api/v1/policy', tags=['v1', 'policy'])


@router.get('/list')
async def list_policy(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[PolicyOut]:
    curr_user = current_employee()
    flt = sa.sql.true()
    if query.filter:
        flt = filter_to_query(query.filter, m.Policy, available_fields=['name'])  # type: ignore
    sorts = (m.Policy.name,)
    if query.sort_by:
        sorts = sort_to_query(
            m.Policy,
            query.sort_by,
            direction=query.direction,
            available_sort_fields=['name'],
        )
    count_result = await session.execute(
        sa.select(sa.func.count())  # pylint: disable=not-callable
        .select_from(m.Policy)
        .filter(flt)
    )
    if (count := count_result.scalar()) is None:
        count = 0
    subquery = (
        sa.select(m.PolicyRevision)
        .where(
            m.PolicyRevision.published.isnot(None),
            m.Policy.id == m.PolicyRevision.policy_id,
        )
        .order_by(m.PolicyRevision.published.desc())
        .limit(1)
        .lateral()
    )
    quiz_result_subquery = (
        sa.select(m.EmployeeQuizResult)
        .where(
            m.EmployeeQuizResult.quiz_id == m.Policy.quiz_id,
            m.EmployeeQuizResult.employee_id == curr_user.id,
            m.EmployeeQuizResult.passed.is_(True),
            m.EmployeeQuizResult.confirmed.isnot(None),
        )
        .order_by(m.EmployeeQuizResult.created.desc())
        .limit(1)
        .lateral()
    )
    results = await session.execute(
        sa.select(
            m.Policy,
            subquery.c.policy_revision,
            subquery.c.published,
            m.PolicyRevisionApproveRecord.approved,
            m.PolicyEmployeeExclusion.created.label('excluded_at'),
            quiz_result_subquery.c.created,
        )
        .outerjoin(
            subquery,
            subquery.c.policy_id == m.Policy.id,
        )
        .outerjoin(
            m.PolicyRevisionApproveRecord,
            sa.and_(
                m.PolicyRevisionApproveRecord.employee_id == curr_user.id,
                m.PolicyRevisionApproveRecord.policy_revision_id == subquery.c.id,
            ),
        )
        .outerjoin(
            m.PolicyEmployeeExclusion,
            sa.and_(
                m.PolicyEmployeeExclusion.employee_id == curr_user.id,
                m.PolicyEmployeeExclusion.policy_id == m.Policy.id,
            ),
        )
        .outerjoin(
            quiz_result_subquery,
            quiz_result_subquery.c.quiz_id == m.Policy.quiz_id,
        )
        .filter(flt)
        .order_by(*sorts)
        .limit(query.limit)
        .offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[
            PolicyOut.from_obj(
                policy,
                rev,
                approved=approved,
                can_approve=bool(
                    not policy.canceled and rev and not approved and not excluded_at
                ),
                quiz_passed=bool(
                    rev_published
                    and quiz_result_created
                    and rev_published < quiz_result_created
                ),
            )
            for policy, rev, rev_published, approved, excluded_at, quiz_result_created in results.all()
        ],
    )


@router.get('/select')
async def select_policy(
    query: SelectParams = Depends(SelectParams),
    session: AsyncSession = Depends(get_db_session),
) -> SelectOutput:
    q = sa.select(m.Policy)
    if query.search:
        q = q.filter(m.Policy.name.ilike(f'%{query.search}%'))
    results = await session.scalars(q.order_by('name').limit(10))
    return make_select_output(
        items=[
            SelectFieldInt.from_obj(obj, label='name', value='id')
            for obj in results.all()
        ]
    )


@router.get('/{policy_id}')
async def get_policy(
    policy_id: int, session: AsyncSession = Depends(get_db_session)
) -> BasePayloadOutput[PolicyOut]:
    curr_user = current_employee()
    subquery = (
        sa.select(m.PolicyRevision)
        .where(
            m.PolicyRevision.published.isnot(None),
            m.Policy.id == m.PolicyRevision.policy_id,
        )
        .order_by(m.PolicyRevision.published.desc())
        .limit(1)
        .lateral()
    )
    quiz_result_subquery = (
        sa.select(m.EmployeeQuizResult)
        .where(
            m.EmployeeQuizResult.quiz_id == m.Policy.quiz_id,
            m.EmployeeQuizResult.employee_id == curr_user.id,
            m.EmployeeQuizResult.passed.is_(True),
            m.EmployeeQuizResult.confirmed.isnot(None),
        )
        .order_by(m.EmployeeQuizResult.created.desc())
        .limit(1)
        .lateral()
    )
    results = await session.execute(
        sa.select(
            m.Policy,
            subquery.c.policy_revision,
            subquery.c.published,
            m.PolicyRevisionApproveRecord.approved,
            m.PolicyEmployeeExclusion.created.label('excluded_at'),
            quiz_result_subquery.c.created,
        )
        .where(m.Policy.id == policy_id)
        .outerjoin(subquery, subquery.c.policy_id == m.Policy.id)
        .outerjoin(
            m.PolicyRevisionApproveRecord,
            sa.and_(
                m.PolicyRevisionApproveRecord.employee_id == curr_user.id,
                m.PolicyRevisionApproveRecord.policy_revision_id == subquery.c.id,
            ),
        )
        .outerjoin(
            m.PolicyEmployeeExclusion,
            sa.and_(
                m.PolicyEmployeeExclusion.employee_id == curr_user.id,
                m.PolicyEmployeeExclusion.policy_id == policy_id,
            ),
        )
        .outerjoin(
            quiz_result_subquery,
            quiz_result_subquery.c.quiz_id == m.Policy.quiz_id,
        )
    )
    if not (result := results.one_or_none()):
        raise HTTPException(404, detail='policy not found')
    (
        policy,
        current_revision,
        current_revision_published,
        approved,
        excluded_at,
        quiz_result_created,
    ) = result
    can_approve = bool(
        not policy.canceled and current_revision and not approved and not excluded_at
    )
    quiz_passed = bool(
        current_revision_published
        and quiz_result_created
        and current_revision_published < quiz_result_created
    )
    return make_success_output(
        payload=PolicyOut.from_obj(
            policy,
            current_revision,
            approved=approved,
            can_approve=can_approve,
            quiz_passed=quiz_passed,
        )
    )


@router.post('')
async def create_policy(
    body: PolicyCreate, session: AsyncSession = Depends(get_db_session)
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    try:
        obj = m.Policy(name=body.name)
        session.add(obj)
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(409, detail='duplicate') from err
    return make_id_output(obj.id)


@router.put('/{policy_id}')
async def update_policy(
    policy_id: int, body: PolicyUpdate, session: AsyncSession = Depends(get_db_session)
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    obj = await session.scalar(sa.select(m.Policy).where(m.Policy.id == policy_id))
    if not obj:
        raise HTTPException(404, detail='policy not found')
    data = body.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(obj, k, v)
    if session.is_modified(obj):
        await session.commit()
    return make_id_output(obj.id)


@router.post('/{policy_id}/revision')
async def create_policy_revision(
    policy_id: int,
    body: PolicyRevisionCreate,
    session: AsyncSession = Depends(get_db_session),
) -> PolicyRevisionRevisionShorOut:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    policy = await session.scalar(
        sa.select(m.Policy).where(m.Policy.id == policy_id, m.Policy.canceled.is_(None))
    )
    if not policy:
        raise HTTPException(404, detail='policy not found')
    max_rev: int | None = await session.scalar(
        sa.select(
            sa.func.max(  # pylint: disable=not-callable
                m.PolicyRevision.policy_revision
            )
        ).where(m.PolicyRevision.policy_id == policy_id)
    )
    if not max_rev:
        max_rev = 0
    obj = m.PolicyRevision(
        policy_id=policy_id,
        policy_revision=max_rev + 1,
        created_by_id=curr_user.id,
        updated_by_id=curr_user.id,
        text=body.text,
    )
    session.add(obj)
    await session.commit()
    return PolicyRevisionRevisionShorOut(
        policy_id=policy_id, policy_revision=obj.policy_revision
    )


@router.put('/{policy_id}/revision/{policy_revision}')
async def update_policy_revision(
    policy_id: int,
    policy_revision: int,
    body: PolicyRevisionUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    policy = await session.scalar(
        sa.select(m.Policy).where(m.Policy.id == policy_id, m.Policy.canceled.is_(None))
    )
    if not policy:
        raise HTTPException(404, detail='policy not found')
    revision: m.PolicyRevision | None = await session.scalar(
        sa.select(m.PolicyRevision).where(
            m.PolicyRevision.policy_id == policy_id,
            m.PolicyRevision.policy_revision == policy_revision,
        )
    )
    if not revision:
        raise HTTPException(404, detail='revision not found')
    if revision.published:
        raise HTTPException(422, detail='revision already published')
    data = body.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(revision, k, v)
    if session.is_modified(revision):
        await session.commit()
    return make_id_output(policy_id)


@router.get('/{policy_id}/revision/list')
async def list_policy_revision(
    policy_id: int,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[PolicyRevisionOut]:
    policy: m.Policy | None = await session.scalar(
        sa.select(m.Policy).where(m.Policy.id == policy_id)
    )
    if not policy:
        raise HTTPException(404, detail='policy not found')
    flt = m.PolicyRevision.policy_id == policy_id
    count_result = await session.execute(
        sa.select(sa.func.count())  # pylint: disable=not-callable
        .select_from(m.PolicyRevision)
        .filter(flt)
    )
    if (count := count_result.scalar()) is None:
        count = 0
    sorts = (m.PolicyRevision.policy_revision,)
    if query.sort_by:
        sorts = sort_to_query(
            m.PolicyRevision,
            query.sort_by,
            direction=query.direction,
            available_sort_fields=[
                'policy_revision',
                'created',
                'updated',
                'published',
            ],
        )
    results = await session.scalars(
        sa.select(m.PolicyRevision)
        .order_by(*sorts)
        .filter(flt)
        .limit(query.limit)
        .offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[PolicyRevisionOut.from_obj(rev) for rev in results.all()],
    )


@router.get('/{policy_id}/revision/{revision}')
async def get_policy_revision(
    policy_id: int, revision: int, session: AsyncSession = Depends(get_db_session)
) -> BasePayloadOutput[PolicyRevisionOut]:
    policy: m.Policy | None = await session.scalar(
        sa.select(m.Policy).where(m.Policy.id == policy_id)
    )
    if not policy:
        raise HTTPException(404, detail='policy not found')
    revision_obj: m.PolicyRevision | None = await session.scalar(
        sa.select(m.PolicyRevision).where(
            m.PolicyRevision.policy_revision == revision,
            m.PolicyRevision.policy_id == policy_id,
        )
    )
    if not revision_obj:
        raise HTTPException(404, detail='revision not found')
    q_approved = (
        sa.select(
            sa.func.count(  # pylint: disable=not-callable
                m.PolicyRevisionApproveRecord.approved
            ),
            sa.func.count(m.Employee.id)  # pylint: disable=not-callable
            - sa.func.count(  # pylint: disable=not-callable
                m.PolicyRevisionApproveRecord.approved
            ),
        )
        .select_from(m.Employee)
        .outerjoin(
            m.PolicyRevisionApproveRecord,
            sa.and_(
                m.PolicyRevisionApproveRecord.employee_id == m.Employee.id,
                m.PolicyRevisionApproveRecord.policy_revision_id == revision_obj.id,
            ),
        )
        .outerjoin(
            m.PolicyEmployeeExclusion,
            sa.and_(
                m.PolicyEmployeeExclusion.employee_id == m.Employee.id,
                m.PolicyEmployeeExclusion.policy_id == policy_id,
            ),
        )
        .where(
            sa.and_(
                m.Employee.active.is_(True),
                m.PolicyEmployeeExclusion.created.is_(None),
            )
        )
    )
    res_approved = await session.execute(q_approved)
    count_approved, count_unapproved = res_approved.all()[0]
    return make_success_output(
        payload=PolicyRevisionOut.from_obj(
            revision_obj,
            count_approved=count_approved,
            count_unapproved=count_unapproved,
        )
    )


@router.put('/{policy_id}/revision/{policy_revision}/publish')
async def publish_policy_revision(
    policy_id: int,
    policy_revision: int,
    session: AsyncSession = Depends(get_db_session),
) -> PolicyRevisionRevisionShorOut:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='Forbidden')
    policy = await session.scalar(
        sa.select(m.Policy).where(m.Policy.id == policy_id, m.Policy.canceled.is_(None))
    )
    if not policy:
        raise HTTPException(404, detail='policy not found')
    revision: m.PolicyRevision | None = await session.scalar(
        sa.select(m.PolicyRevision).where(
            m.PolicyRevision.policy_id == policy_id,
            m.PolicyRevision.policy_revision == policy_revision,
        )
    )
    if not revision:
        raise HTTPException(404, detail='revision not found')
    if revision.published:
        raise HTTPException(422, detail='revision already published')
    revision.published = datetime.utcnow()
    revision.published_by_id = curr_user.id
    await session.commit()
    return PolicyRevisionRevisionShorOut(
        policy_id=policy_id, policy_revision=policy_revision
    )


@router.put('/{policy_id}/approve')
async def approve_policy(
    policy_id: int, session: AsyncSession = Depends(get_db_session)
) -> PolicyRevisionRevisionShorOut:
    curr_user = current_employee()
    subquery = (
        sa.select(m.PolicyRevision)
        .where(
            m.PolicyRevision.published.isnot(None),
            m.Policy.id == m.PolicyRevision.policy_id,
        )
        .order_by(m.PolicyRevision.published.desc())
        .limit(1)
        .lateral()
    )
    results = await session.execute(
        sa.select(
            m.Policy,
            subquery.c.id,
            subquery.c.policy_revision,
            subquery.c.published,
        )
        .where(m.Policy.id == policy_id)
        .outerjoin(
            subquery,
            subquery.c.policy_id == m.Policy.id,
        )
    )
    if not (result := results.one_or_none()):
        raise HTTPException(404, detail='policy not found')
    policy, revision_id, revision_num, revision_published = result
    if policy.quiz:
        quiz_result_query = (
            sa.select(m.EmployeeQuizResult)
            .where(
                m.EmployeeQuizResult.quiz_id == m.Policy.quiz_id,
                m.EmployeeQuizResult.employee_id == curr_user.id,
                m.EmployeeQuizResult.passed.is_(True),
                m.EmployeeQuizResult.confirmed.isnot(None),
            )
            .order_by(m.EmployeeQuizResult.created.desc())
            .limit(1)
        )
        quiz_result: m.EmployeeQuizResult | None = await session.scalar(
            quiz_result_query
        )
        if not quiz_result:
            raise HTTPException(
                409, detail='you have to pass the quiz to approve the policy'
            )
        if bool(
            quiz_result
            and revision_published
            and quiz_result.created < revision_published
        ):
            raise HTTPException(
                409, detail='you have to pass the quiz to approve the policy'
            )
    if policy.canceled:
        raise HTTPException(422, detail='policy canceled')
    curr_user = current_employee()
    approve_record = m.PolicyRevisionApproveRecord(
        policy_revision_id=revision_id,
        employee_id=curr_user.id,
        approved=datetime.utcnow(),
    )
    try:
        session.add(approve_record)
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(409, detail='policy already approved') from err
    return PolicyRevisionRevisionShorOut(
        policy_id=policy.id, policy_revision=revision_num
    )


@router.delete('/{policy_id}')
async def cancel_policy(
    policy_id: int, session: AsyncSession = Depends(get_db_session)
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin and not curr_user.is_hr:
        raise HTTPException(403, detail='forbidden')
    obj: m.Policy | None = await session.scalar(
        sa.select(m.Policy).where(m.Policy.id == policy_id)
    )
    if not obj:
        raise HTTPException(404, detail='policy not found')
    if obj.canceled:
        raise HTTPException(422, detail='policy already canceled')
    obj.canceled = datetime.utcnow()
    obj.canceled_by_id = curr_user.id
    await session.commit()
    return make_id_output(policy_id)


@router.get('/{policy_id}/revision/{policy_revision}/employee/list')
async def list_policy_revision_employee(
    policy_id: int,
    policy_revision: int,
    approved: bool | None = None,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[EmployeePolicyApproveOut]:
    policy: m.Policy | None = await session.scalar(
        sa.select(m.Policy).where(m.Policy.id == policy_id)
    )
    if not policy:
        raise HTTPException(404, detail='policy not found')
    revision_obj: m.PolicyRevision | None = await session.scalar(
        sa.select(m.PolicyRevision).where(
            m.PolicyRevision.policy_revision == policy_revision,
            m.PolicyRevision.policy_id == policy_id,
        )
    )
    if not revision_obj:
        raise HTTPException(404, detail='revision not found')
    if not revision_obj.published:
        return make_list_output(
            count=0,
            limit=query.limit,
            offset=query.limit,
            items=[],
        )
    approved_flt = sa.sql.true()
    if approved is True:
        approved_flt = m.PolicyRevisionApproveRecord.approved.isnot(None)  # type: ignore
    elif approved is False:
        approved_flt = m.PolicyRevisionApproveRecord.approved.is_(None)  # type: ignore
    q = (
        sa.select(
            m.Employee,
            m.PolicyRevisionApproveRecord.approved,
        )
        .outerjoin(
            m.PolicyRevisionApproveRecord,
            sa.and_(
                m.PolicyRevisionApproveRecord.employee_id == m.Employee.id,
                m.PolicyRevisionApproveRecord.policy_revision_id == revision_obj.id,
            ),
        )
        .outerjoin(
            m.PolicyEmployeeExclusion,
            sa.and_(
                m.PolicyEmployeeExclusion.employee_id == m.Employee.id,
                m.PolicyEmployeeExclusion.policy_id == policy_id,
            ),
        )
        .where(
            m.PolicyEmployeeExclusion.created.is_(None),
        )
        .filter(approved_flt)
    )
    if query.filter:
        flt = filter_to_query(
            query.filter,
            m.Employee,
            available_fields=[
                'english_name',
                'native_name',
                'email',
                'active',
                'team_id',
                'organization_id',
                'managers',
            ],
        )  # type: ignore
        q = q.filter(flt)  # type: ignore
    count_res = await session.scalar(
        sa.select(sa.func.count()).select_from(  # pylint: disable=not-callable
            q.subquery()
        )
    )
    if not (count := count_res):
        count = 0
    sorts = (m.Employee.english_name,)
    if query.sort_by:
        sorts = sort_to_query(
            m.Employee,
            query.sort_by,
            direction=query.direction,
            available_sort_fields=['english_name', 'native_name', 'email', 'account'],
        )
    results = await session.execute(
        q.order_by(*sorts).limit(query.limit).offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[
            EmployeePolicyApproveOut.from_obj(emp, approved)
            for emp, approved in results
        ],
    )


@router.post('/{policy_id}/notify')
async def notify_unapproved_employees(
    policy_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    subquery = (
        sa.select(m.PolicyRevision)
        .where(
            m.PolicyRevision.published.isnot(None),
            m.Policy.id == m.PolicyRevision.policy_id,
        )
        .order_by(m.PolicyRevision.published.desc())
        .limit(1)
        .lateral()
    )
    results = await session.execute(
        sa.select(
            m.Policy,
            subquery.c.policy_revision,
        )
        .where(m.Policy.id == policy_id)
        .outerjoin(
            subquery,
            subquery.c.policy_id == m.Policy.id,
        )
    )
    if not (result := results.one_or_none()):
        raise HTTPException(404, detail='policy not found')
    policy, current_revision = result
    if not policy or not current_revision:
        raise HTTPException(404, detail='policy or current revision not found')
    if policy.canceled:
        raise HTTPException(422, detail='policy canceled')
    revision_obj: m.PolicyRevision | None = await session.scalar(
        sa.select(m.PolicyRevision).where(
            m.PolicyRevision.policy_revision == current_revision,
            m.PolicyRevision.policy_id == policy_id,
        )
    )
    if not revision_obj:
        raise HTTPException(404, detail='revision not found')
    q = (
        sa.select(m.Employee)
        .outerjoin(
            m.PolicyEmployeeExclusion,
            sa.and_(
                m.PolicyEmployeeExclusion.employee_id == m.Employee.id,
                m.PolicyEmployeeExclusion.policy_id == policy_id,
            ),
        )
        .where(
            m.Employee.active.is_(True),
            m.PolicyEmployeeExclusion.created.is_(None),
        )
        .outerjoin(
            m.PolicyRevisionApproveRecord,
            sa.and_(
                m.PolicyRevisionApproveRecord.employee_id == m.Employee.id,
                m.PolicyRevisionApproveRecord.policy_revision_id == revision_obj.id,
            ),
        )
        .filter(m.PolicyRevisionApproveRecord.approved.is_(None))
    )
    employees_raw = await session.execute(q)
    employees = [emp[0] for emp in employees_raw]
    msg = f'Please read and accept policy [**{policy.name}**]({CONFIG.PUBLIC_BASE_URL}/policies/view/{policy_id})'
    for emp in employees:
        await Notification(
            items=[
                NotificationMessage(
                    destination=NotificationDestinationEmployee.SELF,
                    related_object=emp,
                    msg=msg,
                )
            ]
        ).send()
    return make_id_output(policy_id)


@router.post('/{policy_id}/exclusion')
async def create_policy_exclusion(
    policy_id: int,
    body: PolicyExclusionCreate,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(403, detail='forbidden')
    policy: m.Policy | None = await session.scalar(
        sa.select(m.Policy).where(m.Policy.id == policy_id)
    )
    if not policy:
        raise HTTPException(404, detail='policy not found')
    emp: m.Employee | None = await get_employee_by_id(body.employee_id, session=session)
    if not emp:
        raise HTTPException(404, detail='employee not found')
    obj = m.PolicyEmployeeExclusion(
        policy_id=policy.id,
        employee_id=emp.id,
        created_by_id=curr_user.id,
    )
    session.add(obj)
    try:
        await session.commit()
    except IntegrityError as err:
        raise HTTPException(409, detail='employee already excluded') from err
    return make_id_output(policy.id)


@router.delete('/{policy_id}/exclusion/{employee_id}')
async def delete_policy_exclusion(
    policy_id: int,
    employee_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> BaseModelIdOutput:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(403, detail='forbidden')
    obj: m.PolicyEmployeeExclusion | None = await session.scalar(
        sa.select(m.PolicyEmployeeExclusion).where(
            m.PolicyEmployeeExclusion.employee_id == employee_id,
            m.PolicyEmployeeExclusion.policy_id == policy_id,
        )
    )
    if not obj:
        raise HTTPException(404, detail='exclusion not found')
    await session.delete(obj)
    await session.commit()
    return make_id_output(policy_id)


@router.get('/{policy_id}/exclusion/employee/list')
async def list_policy_exclusion(
    policy_id: int,
    excluded: bool | None = None,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput[PolicyEmployeeListExclusionOut]:
    policy: m.Policy | None = await session.scalar(
        sa.select(m.Policy).where(m.Policy.id == policy_id)
    )
    if not policy:
        raise HTTPException(404, detail='policy not found')
    excluded_flt = sa.sql.true()
    if excluded is True:
        excluded_flt = m.PolicyEmployeeExclusion.created.isnot(None)  # type: ignore
    elif excluded is False:
        excluded_flt = m.PolicyEmployeeExclusion.created.is_(None)  # type: ignore
    q = (
        sa.select(
            m.Employee,
            m.PolicyEmployeeExclusion.created,
        )
        .outerjoin(
            m.PolicyEmployeeExclusion,
            sa.and_(
                m.PolicyEmployeeExclusion.employee_id == m.Employee.id,
                m.PolicyEmployeeExclusion.policy_id == policy_id,
            ),
        )
        .filter(excluded_flt)
    )
    if query.filter:
        flt = filter_to_query(
            query.filter,
            m.Employee,
            available_fields=[
                'english_name',
                'native_name',
                'email',
                'active',
                'team_id',
                'organization_id',
                'managers',
            ],
        )  # type: ignore
        q = q.filter(flt)  # type: ignore
    count = await count_select_query_results(q, session=session)
    sorts = (m.Employee.english_name,)
    if query.sort_by:
        sorts = sort_to_query(
            m.Employee,
            query.sort_by,
            direction=query.direction,
            available_sort_fields=['english_name', 'native_name', 'email', 'account'],
        )
    results = await session.execute(
        q.order_by(*sorts).limit(query.limit).offset(query.offset)
    )
    return make_list_output(
        count=count,
        limit=query.limit,
        offset=query.offset,
        items=[
            PolicyEmployeeListExclusionOut.from_obj(emp, created)
            for emp, created in results
        ],
    )


@router.get('/{policy_id}/diff')
async def get_revisions_diff(
    policy_id: int,
    rev_old: int,
    rev_new: int,
    session: AsyncSession = Depends(get_db_session),
) -> PolicyDiffOut:
    policy: m.Policy | None = await session.scalar(
        sa.select(m.Policy).where(m.Policy.id == policy_id)
    )
    if rev_new == rev_old:
        raise HTTPException(
            HTTPStatus.BAD_REQUEST, detail='revisions should be different'
        )
    if not policy:
        raise HTTPException(404, detail='policy not found')
    revisions_raw = await session.scalars(
        sa.select(m.PolicyRevision).where(
            m.PolicyRevision.policy_revision.in_(
                (
                    rev_old,
                    rev_new,
                )
            ),
            m.PolicyRevision.policy_id == policy_id,
        )
    )
    revision_new = None
    revision_old = None
    for rev in revisions_raw.all():
        if rev.policy_revision == rev_new:
            revision_new = rev
        if rev.policy_revision == rev_old:
            revision_old = rev
    if not revision_new or not revision_old:
        raise HTTPException(404, detail='revision not found')
    diff = diff_html(revision_old.text, revision_new.text)
    return PolicyDiffOut(text=diff)
