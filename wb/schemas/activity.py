import typing as t
from datetime import datetime

from pydantic import BaseModel

from ._base import BaseOutModel, SelectFieldInt

if t.TYPE_CHECKING:
    import wb.models as m

__all__ = (
    'ActivityTarget',
    'ActivityOut',
)


class ActivityTarget(BaseModel):
    id: str
    name: str | None
    link: str | None


class ActivityOut(BaseOutModel['m.Activity']):
    source: SelectFieldInt
    time: datetime
    duration: int
    action: str
    target: ActivityTarget

    @classmethod
    def from_obj(cls, obj: 'm.Activity') -> t.Self:
        return cls(
            source=SelectFieldInt.from_obj(obj.source, label='name', value='id'),
            time=obj.time,
            duration=obj.duration,
            action=obj.action,
            target=ActivityTarget(
                id=obj.target_id,
                name=obj.target_name,
                link=obj.target_link,
            ),
        )
