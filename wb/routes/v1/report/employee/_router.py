import re
from datetime import date, datetime
from http import HTTPStatus
from typing import Any, Dict

import sqlalchemy as sa
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

import wb.models as m
from wb.db import get_db_session
from wb.schemas import (
    BaseListOutput,
    ListFilterParams,
    SelectField,
    SelectOutput,
    SelectParams,
)
from wb.schemas.output import BasePayloadOutput, SuccessPayloadOutput
from wb.utils.current_user import current_employee
from wb.utils.query import make_select_output, make_success_output
from wb.utils.search import filter_to_query

from .activity_details import generate_activity_details_report
from .activity_summary import generate_activity_summary_report
from .activity_total_by_range import generate_activity_total_by_range_report
from .day_off import generate_day_off_details_report, generate_day_off_summary_report
from .done_tasks_report.summary import generate_done_tasks_summary_report
from .done_tasks_report.summary_total import generate_done_tasks_summary_total_report
from .due_date import generate_due_date_report
from .free_vacation_days import generate_free_days_report
from .presence import generate_presence_report
from .presence_summary import generate_presence_summary_report
from .schemas import IssuesSettingsOut, IssuesSettingsUpdate
from .working_time_month_report import generate_working_time_month_report

__all__ = ('router',)


router = APIRouter(prefix='/api/v1/report/employee', tags=['v1', 'report'])

REPORT_TYPES: Dict[str, str] = {
    'vacation-free-days-report': 'Vacation free days',
    'activity-summary-report': 'Activity summary',
    'activity-details-report': 'Activity details',
    'presence': 'Presence details',
    'presence-summary-report': 'Presence summary',
    'activity-summary-total-report': 'Activity summary total',
    'day-off-summary-report': 'Day off summary report',
    'day-off-details-report': 'Day off details report',
    'calendar-report': 'Calendar report',
    'due-date-report': 'Due date report',
    'done-tasks-summary-total-report': 'Done tasks summary total',
}

REPORT_FORMATS = (
    'default',
    'csv',
)


def _get_employee_filter(query_filter: str | None) -> Any:
    if not query_filter:
        return sa.sql.true()
    return filter_to_query(
        query_filter,
        m.Employee,
        available_fields=[
            'id',
            'uuid',
            'english_name',
            'native_name',
            'email',
            'account',
            'active',
            'team_id',
            'organization_id',
            'managers',
            'work_started',
        ],
    )  # type: ignore


@router.get('/select')
async def list_report_type(query: SelectParams = Depends(SelectParams)) -> SelectOutput:
    return make_select_output(
        items=[
            SelectField(label=v, value=k)
            for k, v in filter(
                lambda item: re.match(f'.*{query.search}.*', item[1], re.IGNORECASE),
                REPORT_TYPES.items(),
            )
        ]
    )


@router.get('/vacation-free-days-report')
async def get_vacation_free_dats_report(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput:
    flt = _get_employee_filter(query.filter)
    report = await generate_free_days_report(flt, session=session)
    return report.make_list_output()


@router.get('/vacation-free-days-report/csv')
async def get_vacation_free_dats_report_csv(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> StreamingResponse:
    flt = _get_employee_filter(query.filter)
    report = await generate_free_days_report(flt, session=session)
    output = report.make_csv()
    return StreamingResponse(iter([output.getvalue()]), media_type='text/csv')


@router.get('/working-time-month-report')
async def get_working_time_month_report(
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> StreamingResponse:
    flt = _get_employee_filter(query.filter)
    res = await generate_working_time_month_report(flt, date.today(), session=session)
    headers = {
        'Content-Disposition': 'attachment; filename="working_time_month_report.xlsx"'
    }
    return StreamingResponse(iter([res]), headers=headers)


@router.get('/activity-summary-report')
async def get_activity_summary_report(
    start: date,
    end: date,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput:
    flt = _get_employee_filter(query.filter)
    report = await generate_activity_summary_report(flt, start, end, session=session)
    return report.make_list_output()


@router.get('/activity-summary-report/csv')
async def get_activity_summary_report_csv(
    start: date,
    end: date,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> StreamingResponse:
    flt = _get_employee_filter(query.filter)
    report = await generate_activity_summary_report(flt, start, end, session=session)
    output = report.make_csv()
    return StreamingResponse(iter([output.getvalue()]), media_type='text/csv')


@router.get('/activity-details-report')
async def get_activity_details_report(
    start: date,
    end: date,
    query: ListFilterParams = Depends(ListFilterParams),
    activity_filter: str | None = Query(None, description='activity filter'),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput:
    activity_flt = None
    if activity_filter:
        activity_flt = filter_to_query(
            activity_filter, m.Activity, available_fields=['source_id', 'action']
        )
    report = await generate_activity_details_report(
        query.filter, start, end, activity_filter=activity_flt, session=session
    )
    return report.make_list_output()


@router.get('/activity-details-report/csv')
async def get_activity_details_report_csv(
    start: date,
    end: date,
    query: ListFilterParams = Depends(ListFilterParams),
    activity_filter: str | None = Query(None, description='activity filter'),
    session: AsyncSession = Depends(get_db_session),
) -> StreamingResponse:
    activity_flt = None
    if activity_filter:
        activity_flt = filter_to_query(
            activity_filter, m.Activity, available_fields=['source_id', 'action']
        )
    report = await generate_activity_details_report(
        query.filter, start, end, activity_filter=activity_flt, session=session
    )
    output = report.make_csv()
    return StreamingResponse(iter([output.getvalue()]), media_type='text/csv')


@router.get('/presence')
async def get_presence_report(
    start: date,
    end: date,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput:
    flt = _get_employee_filter(query.filter)
    report = await generate_presence_report(flt, start, end, session=session)
    aa = report.make_list_output()
    return aa


@router.get('/presence/csv')
async def get_presence_report_csv(
    start: date,
    end: date,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> StreamingResponse:
    flt = _get_employee_filter(query.filter)
    report = await generate_presence_report(flt, start, end, session=session)
    output = report.make_csv()
    return StreamingResponse(iter([output.getvalue()]), media_type='text/csv')


@router.get('/presence-summary-report')
async def get_presence_summary_report(
    start: date,
    end: date,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput:
    flt = _get_employee_filter(query.filter)
    report = await generate_presence_summary_report(flt, start, end, session=session)
    return report.make_list_output()


@router.get('/presence-summary-report/csv')
async def get_presence_summary_report_csv(
    start: date,
    end: date,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> StreamingResponse:
    flt = _get_employee_filter(query.filter)
    report = await generate_presence_summary_report(flt, start, end, session=session)
    output = report.make_csv()
    return StreamingResponse(iter([output.getvalue()]), media_type='text/csv')


@router.get('/activity-summary-total-report')
async def get_activity_total_report(
    start: date,
    end: date,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput:
    flt = _get_employee_filter(query.filter)
    report = await generate_activity_total_by_range_report(
        flt, start, end, session=session
    )
    return report.make_list_output()


@router.get('/activity-summary-total-report/csv')
async def get_activity_total_report_csv(
    start: date,
    end: date,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> StreamingResponse:
    flt = _get_employee_filter(query.filter)
    report = await generate_activity_total_by_range_report(
        flt, start, end, session=session
    )
    output = report.make_csv()
    return StreamingResponse(iter([output.getvalue()]), media_type='text/csv')


@router.get('/day-off-summary-report')
async def get_day_off_summary_report(
    start: date,
    end: date,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput:
    flt = _get_employee_filter(query.filter)
    report = await generate_day_off_summary_report(flt, start, end, session=session)
    return report.make_list_output()


@router.get('/day-off-summary-report/csv')
async def get_day_off_summary_report_csv(
    start: date,
    end: date,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> StreamingResponse:
    flt = _get_employee_filter(query.filter)
    report = await generate_day_off_summary_report(flt, start, end, session=session)
    output = report.make_csv()
    return StreamingResponse(iter([output.getvalue()]), media_type='text/csv')


@router.get('/day-off-details-report')
async def get_day_off_details_report(
    start: date,
    end: date,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput:
    flt = _get_employee_filter(query.filter)
    report = await generate_day_off_details_report(flt, start, end, session=session)
    return report.make_list_output()


@router.get('/day-off-details-report/csv')
async def get_day_off_details_report_csv(
    start: date,
    end: date,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> StreamingResponse:
    flt = _get_employee_filter(query.filter)
    report = await generate_day_off_details_report(flt, start, end, session=session)
    output = report.make_csv()
    return StreamingResponse(iter([output.getvalue()]), media_type='text/csv')


@router.get('/due-date-report')
async def get_due_date_report(
    start: date,
    end: date,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput:
    flt = _get_employee_filter(query.filter)
    report = await generate_due_date_report(flt, start, end, session=session)
    return report.make_list_output()


@router.get('/due-date-report/csv')
async def get_due_date_report_csv(
    start: date,
    end: date,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> StreamingResponse:
    flt = _get_employee_filter(query.filter)
    report = await generate_due_date_report(flt, start, end, session=session)
    output = report.make_csv()
    return StreamingResponse(iter([output.getvalue()]), media_type='text/csv')


@router.get('/done-tasks-summary-report')
async def get_done_tasks_summary_report(
    start: date,
    end: date,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput:
    flt = _get_employee_filter(query.filter)
    report = await generate_done_tasks_summary_report(flt, start, end, session=session)
    return report.make_list_output()


@router.get('/done-tasks-summary-report/csv')
async def get_done_tasks_summary_report_csv(
    start: date,
    end: date,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> StreamingResponse:
    flt = _get_employee_filter(query.filter)
    report = await generate_done_tasks_summary_report(flt, start, end, session=session)
    output = report.make_csv()
    return StreamingResponse(iter([output.getvalue()]), media_type='text/csv')


@router.get('/done-tasks-summary-total-report')
async def get_done_tasks_summary_total_report(
    start: date,
    end: date,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> BaseListOutput:
    flt = _get_employee_filter(query.filter)
    report = await generate_done_tasks_summary_total_report(
        flt, start, end, session=session
    )
    return report.make_list_output()


@router.get('/done-tasks-summary-total-report/csv')
async def get_done_tasks_summary_total_report_csv(
    start: date,
    end: date,
    query: ListFilterParams = Depends(ListFilterParams),
    session: AsyncSession = Depends(get_db_session),
) -> StreamingResponse:
    flt = _get_employee_filter(query.filter)
    report = await generate_done_tasks_summary_total_report(
        flt, start, end, session=session
    )
    output = report.make_csv()
    return StreamingResponse(iter([output.getvalue()]), media_type='text/csv')


@router.get('/issues-settings')
async def get_issues_settings(
    session: AsyncSession = Depends(get_db_session),
) -> BasePayloadOutput[IssuesSettingsOut]:
    settings = await session.scalar(sa.select(m.IssuesSettings))
    if settings is None:
        settings = m.IssuesSettings()
        session.add(settings)
        await session.commit()
    return make_success_output(payload=IssuesSettingsOut.from_obj(settings))


@router.put('/issues-settings')
async def update_onboarding_settings(
    body: IssuesSettingsUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> SuccessPayloadOutput[IssuesSettingsOut]:
    curr_user = current_employee()
    if not curr_user.is_admin:
        raise HTTPException(HTTPStatus.FORBIDDEN, detail='Forbidden')
    settings = await session.scalar(sa.select(m.IssuesSettings))
    data = body.dict(exclude_unset=True)
    if settings is None:
        settings = m.IssuesSettings()
        session.add(settings)
    data = body.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(settings, k, v)
    settings.updated = datetime.utcnow()
    if session.is_modified(settings):
        await session.commit()
    return make_success_output(payload=IssuesSettingsOut.from_obj(settings))
