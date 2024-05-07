from typing import Any, Dict, Iterable, List, Optional

from pydantic import BaseModel

from wb.schemas import (
    BaseListOutput,
    BaseListPayload,
    BaseModelIdOutput,
    BasePayloadOutput,
    ModelIDField,
    SelectField,
    SelectOutput,
    SuccessPayloadOutput,
)

__all__ = (
    'make_output',
    'make_success_output',
    'make_list_output',
    'get_select_value',
    'make_select_output',
    'make_id_output',
)


def make_output(
    success: bool,
    payload: Optional[BaseModel],
    metadata: Optional[Dict[str, Any]] = None,
) -> BasePayloadOutput:
    return BasePayloadOutput(success=success, payload=payload, metadata=metadata)


def make_success_output(
    payload: Optional[BaseModel], metadata: Optional[Dict[str, Any]] = None
) -> SuccessPayloadOutput:
    return SuccessPayloadOutput(payload=payload, metadata=metadata)  # type: ignore


def make_list_output(
    count: int,
    limit: int,
    offset: int,
    items: List,
    metadata: Optional[Dict[str, Any]] = None,
) -> BaseListOutput:
    return BaseListOutput(
        success=True,
        payload=BaseListPayload(count=count, limit=limit, offset=offset, items=items),
        metadata=metadata,
    )


def make_select_output(items: Iterable[SelectField]) -> SelectOutput:
    return SelectOutput(success=True, payload=list(items))  # type: ignore


def get_select_value(item: Optional[SelectField]) -> Any:
    if item:
        return item.value
    return None


def make_id_output(obj_id: int) -> BaseModelIdOutput:
    return BaseModelIdOutput(payload=ModelIDField(id=obj_id))  # type: ignore
