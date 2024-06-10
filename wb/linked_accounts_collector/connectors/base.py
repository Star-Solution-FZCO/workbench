from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Sequence

import wb.models as m

__all__ = (
    'Connector',
    'AccountData',
    'ConfigValidationError',
)


class ConfigValidationError(Exception):
    pass


@dataclass
class AccountData:
    id: str
    active: bool


class Connector(ABC):
    source: m.LinkedAccountSource

    @classmethod
    @abstractmethod
    def validate_config(cls, conf: Any) -> None:
        pass

    def __init__(self, source: m.LinkedAccountSource):
        self.validate_config(source.config)
        self.source = source

    @abstractmethod
    async def get_account(self, emp: m.Employee) -> AccountData | None:
        pass

    @abstractmethod
    async def get_accounts(
        self, employees: Sequence[m.Employee]
    ) -> dict[int, AccountData | None]:
        pass
