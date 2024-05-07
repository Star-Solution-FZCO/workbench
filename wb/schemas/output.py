from typing import Any, Dict, Generic, List, Optional, TypeVar

from pydantic import BaseModel

from ._base import GenericSelectField

__all__ = (
    'BaseOutput',
    'BasePayloadOutput',
    'SuccessPayloadOutput',
    'ModelFieldMetadata',
    'BaseListOutput',
    'BaseListPayload',
    'SelectOutput',
    'ModelIDField',
    'BaseModelIdOutput',
    'ReportFieldMetadata',
    'SuccessOutput',
)


T = TypeVar('T')


class BaseOutput(BaseModel):
    success: bool


class SuccessOutput(BaseOutput):
    success: bool = True


class BasePayloadOutput(BaseOutput, Generic[T]):
    payload: T
    metadata: Optional[Dict[str, Any]] = None


class SuccessPayloadOutput(BasePayloadOutput, Generic[T]):
    success: bool = True


class ModelFieldMetadata(BaseModel):
    name: str
    label: Optional[str]
    editable: bool


class BaseListPayload(BaseModel, Generic[T]):
    count: int
    limit: int
    offset: int
    items: List[T]


class BaseListOutput(BasePayloadOutput, Generic[T]):
    payload: BaseListPayload[T]


class SelectOutput(SuccessPayloadOutput[list[GenericSelectField]]):
    pass


class ModelIDField(BaseModel):
    id: int


class BaseModelIdOutput(SuccessPayloadOutput[ModelIDField]):
    pass


class ReportFieldMetadata(BaseModel):
    name: str
    label: str
    type: str
