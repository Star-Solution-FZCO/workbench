import typing as t

from ._base import BaseOutModel

if t.TYPE_CHECKING:
    import wb.models as m


__all__ = ('ShortTeamOut',)


class ShortTeamOut(BaseOutModel['m.Team']):
    id: int
    name: str
