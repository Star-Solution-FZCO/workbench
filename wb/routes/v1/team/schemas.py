import typing as t
from datetime import datetime

from pydantic import BaseModel

import wb.models as m
from wb.routes.v1.catalog.team_tags import TeamTagSelectOut
from wb.schemas import (
    BaseOutModel,
    SelectEmployeeField,
    SelectFieldInt,
    ShortEmployeeOut,
)
from wb.utils.current_user import current_user

__all__ = (
    'TeamOut',
    'TeamMemberOut',
    'TeamHistoryRecord',
    'TeamCreate',
    'TeamUpdate',
    'TeamHierarchy',
    'TeamHierarchyOut',
)


class TeamOut(BaseOutModel['m.Team']):
    id: int
    name: str
    key: str | None
    description: str | None
    manager: SelectEmployeeField | None
    head_team: SelectFieldInt | None
    sub_teams: list[SelectFieldInt] | None
    tags: list[TeamTagSelectOut]
    is_current_user_member: bool
    is_archived: bool

    @classmethod
    def from_obj(cls, obj: 'm.Team') -> t.Self:
        data = {
            'id': obj.id,
            'name': obj.name,
            'key': obj.key,
            'description': obj.description,
            'manager': (
                SelectEmployeeField.from_obj(obj.manager) if obj.manager else None
            ),
            'tags': [
                TeamTagSelectOut.from_obj(tag, label='name', value='id')
                for tag in obj.tags
            ],
            'head_team': (
                SelectFieldInt.from_obj(obj.head_team, label='name', value='id')
                if obj.head_team
                else None
            ),
            'sub_teams': [
                SelectFieldInt.from_obj(sub_team, label='name', value='id')
                for sub_team in obj.sub_teams
            ],
            'is_archived': obj.is_archived,
        }
        curr = current_user()
        current_user_team_id = curr.team_id if isinstance(curr, m.Employee) else None
        data['is_current_user_member'] = (
            bool(current_user_team_id) and current_user_team_id == obj.id
        )
        return cls(**data)  # type: ignore


class TeamMemberOut(ShortEmployeeOut):
    position: str | None
    team_position: str | None
    grade: str | None

    _CSV_ROWS: t.ClassVar[list[str]] = [
        'english_name',
        'pararam',
        'position',
        'team_position',
    ]

    @classmethod
    def from_obj(
        cls, user: 'm.Employee', output_grade: bool = False
    ) -> 'TeamMemberOut':
        return cls(
            id=user.id,
            english_name=user.english_name,
            position=user.position.name if user.position else None,
            team_position=user.team_position,
            pararam=user.pararam,
            photo=user.photo,
            grade=user.grade if output_grade else 'A/D',
        )

    def to_csv_row(self) -> list[t.Any]:
        return [
            self.english_name,
            self.pararam,
            self.position,
            self.team_position,
        ]


class TeamHistoryRecord(BaseModel):
    action: str
    user: TeamMemberOut | ShortEmployeeOut | None = None
    time: datetime
    name: str | None = None

    _CSV_ROWS: t.ClassVar[list[str]] = ['time', 'action', 'target']

    def to_csv_row(self) -> list[t.Any]:
        target = ''
        if self.user:
            target = f'{self.user.english_name}'
        elif self.name:
            target = self.name
        return [self.time, self.action, target]


class TeamCreate(BaseModel):
    name: str
    key: str
    description: str | None = None
    manager: SelectFieldInt
    head_team: SelectFieldInt | None = None
    tags: list[SelectFieldInt] | None = None


class TeamUpdate(BaseModel):
    name: str | None = None
    key: str | None = None
    description: str | None = None
    manager: SelectFieldInt | None = None
    head_team: SelectFieldInt | None = None
    tags: list[SelectFieldInt] | None = None


class TeamHierarchyAttributes(BaseModel):
    id: int | None
    manager: ShortEmployeeOut | None


class TeamHierarchy(t.TypedDict):
    name: str
    attributes: TeamHierarchyAttributes
    children: list['TeamHierarchy']


class TeamHierarchyOut(BaseModel):
    name: str
    attributes: TeamHierarchyAttributes
    children: list['TeamHierarchyOut']

    @classmethod
    def from_obj(cls, obj: TeamHierarchy) -> 'TeamHierarchyOut':
        attributes = {
            'id': obj['attributes']['id'],
            'manager': (
                ShortEmployeeOut.from_obj(obj['attributes']['manager'])
                if obj['attributes']['manager']
                else None
            ),
        }
        return cls(
            name=obj['name'],
            attributes=TeamHierarchyAttributes(**attributes),
            children=[cls.from_obj(child) for child in obj['children']],
        )
