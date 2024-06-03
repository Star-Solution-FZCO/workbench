import pickle
from abc import ABC, abstractmethod
from typing import Any

__all__ = (
    'BaseSerializer',
    'PickleSerializer',
)


class BaseSerializer(ABC):
    @abstractmethod
    def dumps(self, value: Any) -> bytes:
        pass

    @abstractmethod
    def loads(self, value: bytes) -> Any:
        pass


class PickleSerializer(BaseSerializer):
    # noinspection PyMethodMayBeStatic
    def dumps(self, value: Any) -> bytes:
        return pickle.dumps(value)

    # noinspection PyMethodMayBeStatic
    def loads(self, value: bytes) -> Any:
        return pickle.loads(value)  # nosec pickle
