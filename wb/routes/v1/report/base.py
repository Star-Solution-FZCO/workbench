import typing as t
from abc import ABC

from pydantic import BaseModel

from wb.schemas import ReportFieldMetadata

__all__ = (
    'BaseReportItem',
    'ReportItemT',
)


class BaseReportItem(BaseModel, ABC):
    @classmethod
    def get_metadata(cls) -> list[ReportFieldMetadata]:
        return [
            ReportFieldMetadata(
                name=name,
                label=field.title,
                type=field.annotation.__name__,
            )
            for name, field in cls.model_fields.items()
        ]


ReportItemT = t.TypeVar('ReportItemT', bound=BaseReportItem)
