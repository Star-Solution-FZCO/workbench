import typing as t

from wb.models.activity import ActivitySource, ActivitySourceType

from .base import Connector as ActivitySourceConnector
from .cvs import *
from .discord import *
from .gerrit import *
from .google import *
from .pararam import *
from .youtrack import *
from .zendesk import *

__all__ = (
    'create_connector',
    'ActivitySourceConnector',
)


CONNECTOR_CLASS_MAPPING: t.Dict[ActivitySourceType, t.Type[ActivitySourceConnector]] = {
    ActivitySourceType.GOOGLE_DRIVE: GoogleDriveConnector,
    ActivitySourceType.YOUTRACK: YoutrackConnector,
    ActivitySourceType.GERRIT: GerritPresenceConnector,
    ActivitySourceType.CVS: CVSConnector,
    ActivitySourceType.GOOGLE_MEET: GoogleMeetConnector,
    ActivitySourceType.PARARAM: PararamConnector,
    ActivitySourceType.ZENDESK: ZendeskConnector,
    ActivitySourceType.DISCORD: DiscordConnector,
}


def create_connector(source: ActivitySource) -> ActivitySourceConnector:
    try:
        return CONNECTOR_CLASS_MAPPING[source.type](source)
    except KeyError as err:
        raise ValueError('wrong source type') from err
