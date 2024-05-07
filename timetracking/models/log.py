from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from timetracking.db import TMBaseDBModel


class Log(TMBaseDBModel):
    __tablename__ = 'log'
    n: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[str] = mapped_column(primary_key=True)
    time: Mapped[datetime] = mapped_column(primary_key=True)
    source: Mapped[str]

    __table_args__ = (sa.UniqueConstraint('n', 'type', 'time'),)
