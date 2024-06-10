from typing import Any

from pydantic import BaseModel

from wb.schemas import SelectField

__all__ = (
    'LinkedAccountSourceCreate',
    'LinkedAccountSourceUpdate',
)


class LinkedAccountSourceCreate(BaseModel):
    type: SelectField
    name: str
    config: Any
    description: str | None = None
    active: bool = True
    public: bool = False


class LinkedAccountSourceUpdate(BaseModel):
    type: SelectField = None
    name: str = None
    config: Any = None
    description: str | None = None
    active: bool = None
    public: bool = None
