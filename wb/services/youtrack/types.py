from typing import Any, Dict, Iterable, List, Optional, Tuple, TypedDict, Union

JsonT = Dict[str, Any]

FieldsT = Iterable[str]


class IssueT(TypedDict):
    id: str
    idReadable: str
    summary: str
    resolved: bool
    description: Optional[str]
    customFields: List[Dict[str, Any]]


CustomFieldListT = Tuple[str, Union[str, int, Dict[str, Any]]]


class TagT(TypedDict):
    id: str


TagsT = list[TagT]


class UserT(TypedDict):
    id: str
    login: str
    fullName: str
    avatarUrl: str
    email: str
    guest: bool
    online: bool
    banned: bool


class UserGroupT(TypedDict):
    name: str
    id: str
    allUsersGroup: bool


class CommandLimitedVisibilityT(TypedDict):
    permittedUsers: List[UserT]
    permittedGroups: List[UserGroupT]


class ParsedCustomFieldT(TypedDict):
    name: str
    updateable: bool
    type: str
    multi: bool
    issue_type: str


class IssueCommentT(TypedDict):
    id: str
    text: str
    created: int
    updated: int
    author: UserT
    attachments: List[Any]


class IssueAttachmentT(TypedDict):
    id: str
    name: str
    created: int
    updated: int
    author: UserT
    size: int
    extension: str | None
    mimeType: str | None
    url: str
    thumbnailUrl: str | None


class IssuesCountT(TypedDict):
    count: int
