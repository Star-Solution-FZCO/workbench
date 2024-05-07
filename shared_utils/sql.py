import pickle
import typing as t
from enum import StrEnum

import sqlalchemy as sa
from cryptography.fernet import Fernet
from sqlalchemy.dialects.postgresql import BYTEA

__all__ = (
    'EncryptedObject',
    'StringEnum',
)

T = t.TypeVar('T')


class EncryptedObject(sa.TypeDecorator[T]):
    """
    A custom SQLAlchemy type decorator for encrypting and decrypting object values.
    It uses fernet symmetric encryption, so you can't search by this column without decryption of values from DB.

    :param inner_cls: The inner class type of the object being encrypted.
    :param passphrase: The passphrase used for encryption and decryption.


    **Example:**

    .. code-block::
        key_str = Fernet.generate_key().decode()

        secret: Mapped[str] = mapped_column(EncryptedObject['str'](str, passphrase=key_str))

    """

    impl = BYTEA
    cache_ok = True
    _inner_cls: type[T]
    __passphrase: bytes

    def __init__(self, inner_cls: type[T], passphrase: str) -> None:
        super().__init__()
        self._inner_cls = inner_cls
        self.__passphrase = passphrase.encode()

    def process_bind_param(self, value: T | None, dialect: sa.Dialect) -> bytes | None:
        if value is None:
            return None
        fernet = Fernet(self.__passphrase)
        return t.cast(bytes, fernet.encrypt(pickle.dumps(value)))

    def process_result_value(
        self, value: bytes | None, dialect: sa.Dialect
    ) -> T | None:
        if value is None:
            return None
        fernet = Fernet(self.__passphrase)
        return t.cast(T, pickle.loads(fernet.decrypt(value)))

    def process_literal_param(self, value: T | None, dialect: sa.Dialect) -> str:
        processor = self.impl_instance.literal_processor(dialect)
        return t.cast(str, processor(self.process_bind_param(value, dialect)))  # type: ignore[misc]

    @property
    def python_type(self) -> type[T]:
        return self._inner_cls


EnumT = t.TypeVar('EnumT', bound=StrEnum)


class StringEnum(sa.TypeDecorator[EnumT]):
    """
    A SQLAlchemy type decorator that converts between StrEnum members and database strings.

    This class allows for an easy representation of Python StrEnum members in a SQL database
    as strings. It handles the conversion from Enum member to string when binding to a
    SQL statement and from string back to Enum member when retrieving results.


    :param enum_cls: The StrEnum class to which the type is mapped.
    :param args: Additional arguments passed to the parent class.
    :param kwargs: Additional keyword arguments passed to the parent class.


    **Example:**

    .. code-block::

        from enum import StrEnum

        class ColorEnum(StrEnum):
            RED = "red"
            GREEN = "green"
            BLUE = "blue"


        # native sql type - VARCHAR
        color_column: Mapped[ColorEnum] = mapped_column(StringEnum['ColorEnum'](ColorEnum))

        # native sql type - VARCHAR(32)
        color_column_2: Mapped[ColorEnum] = mapped_column(StringEnum['ColorEnum'](ColorEnum, 32))

    """

    impl = sa.String
    cache_ok = True

    _enum_cls: type[EnumT]

    def __init__(self, enum_cls: type[EnumT], *args: t.Any, **kwargs: t.Any):
        super().__init__(*args, **kwargs)
        self._enum_cls = enum_cls

    def process_bind_param(
        self, value: EnumT | str | None, dialect: sa.Dialect
    ) -> str | None:
        if value is None:
            return None
        return str(value)

    def process_result_value(
        self, value: str | None, dialect: sa.Dialect
    ) -> EnumT | None:
        if value is None:
            return None
        return self._enum_cls(value)

    def process_literal_param(self, value: EnumT | None, dialect: sa.Dialect) -> str:
        processor = self.impl_instance.literal_processor(dialect)
        return t.cast(str, processor(self.process_bind_param(value, dialect)))  # type: ignore[misc]

    @property
    def python_type(self) -> type[EnumT]:
        return self._enum_cls
