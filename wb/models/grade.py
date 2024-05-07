from datetime import datetime
from typing import Dict, List, Optional

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from ._base import BaseDBModel

__all__ = (
    'Grade',
    'SUB_GRADES',
)


SUB_GRADES = ['+', '', '-']


class Grade(BaseDBModel):
    __tablename__ = 'grades'

    id: Mapped[int] = mapped_column(primary_key=True)
    created: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    updated: Mapped[datetime] = mapped_column(
        server_default=sa.func.now()  # pylint: disable=not-callable
    )
    revision: Mapped[int] = mapped_column(nullable=False, default=0)
    name: Mapped[str] = mapped_column(unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column()

    @property
    def sub_grades(self) -> List[Dict[str, Optional[str]]]:
        return [
            {'name': f'{self.name}{sg}', 'description': self.description}
            for sg in SUB_GRADES
        ]
