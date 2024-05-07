import typing as t

from pydantic import BaseModel

from wb.schemas import BaseOutModel

if t.TYPE_CHECKING:
    import wb.models as m


__all__ = (
    'RequestCreate',
    'EmployeeRequestSettingsOut',
    'EmployeeRequestSettingsUpdate',
)

T = t.TypeVar('T')


class YouTrackProjectSettings(BaseModel):
    short_name: str
    main: bool
    tags: list[str]


class RequestCreate(BaseModel, t.Generic[T]):
    type: str
    data: T


class EmployeeRequestSettingsOut(BaseOutModel['m.EmployeeRequestSettings']):
    work_start: str
    work_end: str
    duration: int
    max_number_parallel_meetings: int
    calendar_ids: list[str]
    youtrack_projects: list[YouTrackProjectSettings]
    unavailability_label: str
    chat_id: str
    content: str | None


class EmployeeRequestSettingsUpdate(BaseModel):
    work_start: str | None = None
    work_end: str | None = None
    duration: int | None = None
    max_number_parallel_meetings: int | None = None
    calendar_ids: list[str] | None = None
    youtrack_projects: list[YouTrackProjectSettings] | None = None
    unavailability_label: str | None = None
    chat_id: str | None = None
    content: str | None = None
