from pydantic import BaseModel

__all__ = (
    'UserAuth',
    'UserProfile',
)


class UserAuth(BaseModel):
    login: str
    password: str
    remember: bool = False


class UserProfile(BaseModel):
    id: int
    english_name: str
    account: str
    email: str
    photo: str | None
    hr: bool
    admin: bool
    timezone: str
    roles: list[str]
