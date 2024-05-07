from datetime import datetime

from pydantic import BaseModel

from wb.models import TMRecordType

__all__ = (
    'TMSetStatus',
    'TMStatusOut',
)


class TMSetStatus(BaseModel):
    status: TMRecordType
    source: str | None = None


class TMStatusOut(BaseModel):
    status: TMRecordType
    updated: datetime | None
