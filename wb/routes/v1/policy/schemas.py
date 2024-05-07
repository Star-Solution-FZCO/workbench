import typing as t
from datetime import datetime

from pydantic import BaseModel

import wb.models as m
from wb.schemas import SelectFieldInt, ShortEmployeeOut

__all__ = (
    'PolicyOut',
    'PolicyCreate',
    'PolicyUpdate',
    'PolicyRevisionRevisionShorOut',
    'PolicyRevisionOut',
    'PolicyRevisionCreate',
    'PolicyRevisionUpdate',
    'EmployeePolicyApproveOut',
    'PolicyExclusionCreate',
    'PolicyEmployeeListExclusionOut',
    'PolicyDiffOut',
)


class PolicyOut(BaseModel):
    id: int
    name: str
    current_revision: int | None
    canceled: datetime | None
    canceled_by: ShortEmployeeOut | None
    approved: datetime | None
    can_approve: bool
    quiz: SelectFieldInt | None
    quiz_passed: bool | None

    @classmethod
    def from_obj(
        cls,
        obj: 'm.Policy',
        current_revision: int | None,
        approved: datetime | None,
        can_approve: bool,
        quiz_passed: bool | None,
    ) -> t.Self:
        return cls(
            id=obj.id,
            name=obj.name,
            canceled=obj.canceled,
            canceled_by=ShortEmployeeOut.from_obj(obj.canceled_by)
            if obj.canceled_by
            else None,  # type: ignore
            current_revision=current_revision,
            approved=approved,
            can_approve=can_approve,
            quiz=(
                SelectFieldInt.from_obj(obj.quiz, label='name', value='id')
                if obj.quiz
                else None
            ),
            quiz_passed=quiz_passed,
        )


class PolicyRevisionRevisionShorOut(BaseModel):
    policy_id: int
    policy_revision: int


class PolicyRevisionOut(BaseModel):
    policy_id: int
    policy_revision: int
    text: str
    created: datetime | None
    created_by: ShortEmployeeOut | None
    updated: datetime | None
    updated_by: ShortEmployeeOut | None
    published: datetime | None
    published_by: ShortEmployeeOut | None
    count_approved: int | None
    count_unapproved: int | None

    @classmethod
    def from_obj(
        cls,
        obj: 'm.PolicyRevision',
        count_approved: int | None = None,
        count_unapproved: int | None = None,
    ) -> t.Self:
        return cls(
            policy_id=obj.policy_id,
            policy_revision=obj.policy_revision,
            text=obj.text,
            created=obj.created,
            created_by=ShortEmployeeOut.from_obj(obj.created_by)
            if obj.created_by
            else None,  # type: ignore
            updated=obj.updated,
            updated_by=ShortEmployeeOut.from_obj(obj.updated_by)
            if obj.updated_by
            else None,  # type: ignore
            published=obj.published,
            published_by=ShortEmployeeOut.from_obj(obj.published_by)
            if obj.published_by
            else None,  # type: ignore
            count_approved=count_approved,
            count_unapproved=count_unapproved,
        )


class PolicyCreate(BaseModel):
    name: str


class PolicyUpdate(BaseModel):
    name: str | None = None
    quiz_id: int | None = None


class PolicyRevisionCreate(BaseModel):
    text: str


class PolicyRevisionUpdate(BaseModel):
    text: str | None = None


class EmployeePolicyApproveOut(ShortEmployeeOut):
    approved: datetime | None

    @classmethod
    def from_obj(cls, user: 'm.Employee', approved: datetime | None = None) -> t.Self:
        return cls(
            id=user.id,
            english_name=user.english_name,
            pararam=user.pararam,
            photo=user.photo,
            approved=approved,
        )


class PolicyExclusionCreate(BaseModel):
    employee_id: int


class PolicyEmployeeListExclusionOut(ShortEmployeeOut):
    excluded: datetime | None

    @classmethod
    def from_obj(cls, user: 'm.Employee', created: datetime | None = None) -> t.Self:
        return cls(
            id=user.id,
            english_name=user.english_name,
            pararam=user.pararam,
            photo=user.photo,
            excluded=created,
        )


class PolicyDiffOut(BaseModel):
    text: str
