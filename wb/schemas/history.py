import pickle
from datetime import datetime
from typing import TYPE_CHECKING, Self

from pydantic import BaseModel

if TYPE_CHECKING:
    import wb.models as m

__all__ = ('FieldHistoryItem',)


class FieldHistoryItem(BaseModel):
    audit_id: int
    time: datetime
    added: list
    deleted: list

    @classmethod
    def from_obj(cls, obj: 'm.AuditEntry', field: str) -> Self:
        if field not in obj.fields:
            raise KeyError(f'Field "{field}" not found in audit entry')
        unpacked_data = pickle.loads(obj.data)  # nosec pickle
        return cls(
            audit_id=obj.id,
            time=obj.time,
            added=unpacked_data[field]['added'],
            deleted=unpacked_data[field]['deleted'],
        )
