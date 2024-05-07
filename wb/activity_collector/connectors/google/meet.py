import datetime
from typing import Any, Dict

from .base import GoogleReportConnector, time_to_ts

__all__ = ('GoogleMeetConnector',)


class GoogleMeetConnector(GoogleReportConnector):
    _event_parameters = ('duration_seconds',)

    def create_link(self, parameters: Dict[str, Any]) -> str:
        return ''

    def create_target_id(self, parameters: Dict[str, Any]) -> str:
        return ''

    def create_time(self, parameters: Dict[str, Any]) -> datetime.datetime:
        return datetime.datetime.utcfromtimestamp(
            time_to_ts(parameters['time']) - parameters.get('duration_seconds', 0)
        )

    def create_action(self, parameters: Dict[str, Any]) -> str:
        if parameters['type'] == 'call' and parameters['name'] == 'call_ended':
            return 'call'
        return parameters['name']  # type: ignore

    def create_duration(self, parameters: Dict[str, Any]) -> int:
        return parameters.get('duration_seconds', 0)
