from sqlalchemy.orm import Mapped, mapped_column

from ._base import BaseDBModel

__all__ = ('UsefulLink',)


class UsefulLink(BaseDBModel):
    __tablename__ = 'useful_links'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    link: Mapped[str]
    description: Mapped[str | None]
