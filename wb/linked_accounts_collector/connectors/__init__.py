from wb.models.linked_accounts import LinkedAccountSource, LinkedAccountSourceType

from .base import ConfigValidationError as LinkedAccountConnectorConfigValidationError
from .base import Connector as LinkedAccountConnector
from .restapi import RestAPIConnector

__all__ = (
    'create_connector',
    'LinkedAccountConnector',
    'LinkedAccountConnectorConfigValidationError',
)


CONNECTOR_CLASS_MAPPING: dict[LinkedAccountSourceType, type[LinkedAccountConnector]] = {
    LinkedAccountSourceType.RESTAPI: RestAPIConnector,
}


def create_connector(source: LinkedAccountSource) -> LinkedAccountConnector:
    try:
        return CONNECTOR_CLASS_MAPPING[source.type](source)
    except KeyError as err:
        raise ValueError('wrong source type') from err
