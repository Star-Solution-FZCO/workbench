from typing import Optional

from fastapi import Query
from pydantic import BaseModel, field_validator

__all__ = (
    'ListFilterParams',
    'SelectParams',
    'ConfluenceAPIParams',
    'ConfluenceSearchParams',
    'RequestQueryParams',
    'ListParams',
)


class ListParams(BaseModel):
    limit: int = Query(50, le=200, description='limit results')
    offset: int = Query(0, description='offset')


class ListFilterParams(BaseModel):
    limit: int = Query(50, le=200, description='limit results')
    offset: int = Query(0, description='offset')
    filter: str | None = Query(None, description='filter params')
    sort_by: str | None = Query(None, max_length=50, description='sort by field')
    direction: str = Query(
        'asc', max_length=4, description='sort direction asc or desc'
    )

    @field_validator('direction')
    def check_direction(cls, v: str) -> str:  # pylint: disable=no-self-argument
        if v not in ('desc', 'asc'):
            raise ValueError('wrong direction')
        return v


class SelectParams(BaseModel):
    search: Optional[str] = Query(default='', description='Filter results by value')


class ConfluenceAPIParams(BaseModel):
    start: int = Query(0)
    limit: int = Query(3)


class ConfluenceSearchParams(ConfluenceAPIParams):
    query: str = Query(default='')
    portal_id: int | None = Query(None)


class RequestQueryParams(BaseModel):
    limit: int = Query(50)
    offset: int = Query(0)
    status: str | None = Query(None)
    requester: str | None = Query(None)
    service: str | None = Query(None)
    search: str | None = Query(None)
