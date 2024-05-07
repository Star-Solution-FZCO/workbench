from typing import Any

from pydantic import BaseModel

import wb.models as m
from wb.schemas import ShortEmployeeOut

from ..service.schemas import ServiceOut

__all__ = (
    'IssueOut',
    'IssueDetailOut',
    'RequestOut',
    'RequestCreate',
    'RequestUpdate',
    'RequestComment',
)


class IssueOut(BaseModel):
    id: str
    idReadable: str
    updated: int
    summary: str
    reporter: Any
    customFields: list[Any]
    updater: Any
    created: int
    project: Any


class IssueDetailOut(IssueOut):
    attachments: list[Any]
    comments: list[Any]
    description: str | None = None


class RequestOut(BaseModel):
    id: int
    created_by: ShortEmployeeOut
    service: ServiceOut
    request: IssueDetailOut

    @classmethod
    def from_obj(cls, obj: m.HelpCenterRequest, issue: Any) -> 'RequestOut':
        return cls(
            id=obj.id,
            created_by=ShortEmployeeOut.from_obj(obj.created_by),
            service=ServiceOut.from_obj(obj.service),
            request=IssueDetailOut(**issue),
        )


class RequestCreate(BaseModel):
    service_id: int
    summary: str
    fields: dict[bytes, Any]
    description: str | None = None


class RequestUpdate(BaseModel):
    summary: str | None = None
    fields: dict[bytes, Any] | None = None
    description: str | None = None


class RequestComment(BaseModel):
    text: str
