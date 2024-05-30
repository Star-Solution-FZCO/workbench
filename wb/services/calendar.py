import json
import uuid
from datetime import datetime
from typing import cast

import caldav
from aiogoogle import Aiogoogle
from aiogoogle.auth.creds import ServiceAccountCreds
from caldav.lib import error
from caldav.objects import Calendar, Event

from wb.config import CONFIG
from wb.log import log

__all__ = (
    'GoogleCalendar',
    'CalDAVClient',
    'get_calendar_client',
)


class GoogleCalendar:
    scopes = ['https://www.googleapis.com/auth/calendar']

    def __init__(self, creds_path: str) -> None:
        with open(creds_path, encoding='utf-8') as creds_file:
            service_account_key = json.load(creds_file)
            self.credentials = ServiceAccountCreds(
                scopes=self.scopes, **service_account_key
            )

    def make_aiogoogle(self) -> Aiogoogle:
        return Aiogoogle(service_account_creds=self.credentials)

    async def get_event(
        self, event_id: str, calendar_id: str = 'primary'
    ) -> dict | None:
        async with self.make_aiogoogle() as aiogoogle:
            calendar = await aiogoogle.discover('calendar', 'v3')
            request = calendar.events.get(calendarId=calendar_id, eventId=event_id)
            event = await aiogoogle.as_service_account(request)
        return cast(dict | None, event)

    async def list_event(
        self,
        time_min: datetime | None,
        time_max: datetime | None,
        timezone: str = 'UTC',
        calendar_id: str = 'primary',
    ) -> list[dict]:
        async with self.make_aiogoogle() as aiogoogle:
            calendar = await aiogoogle.discover('calendar', 'v3')
            request = calendar.events.list(
                calendarId=calendar_id,
                timeMin=time_min,
                timeMax=time_max,
                timeZone=timezone,
            )
            events = []
            while request:
                response = await aiogoogle.as_service_account(request, full_res=True)
                events += response.content.get('items', [])
                request = response.next_page()
        return events

    async def create_event(
        self,
        start: datetime,
        end: datetime,
        timezone: str = 'UTC',
        calendar_id: str = 'primary',
        summary: str | None = None,
        description: str | None = None,
    ) -> dict:
        body: dict = {
            'start': {
                'dateTime': start.isoformat(),
                'timeZone': timezone,
            },
            'end': {
                'dateTime': end.isoformat(),
                'timeZone': timezone,
            },
        }
        if summary:
            body['summary'] = summary
        if description:
            body['description'] = description
        async with self.make_aiogoogle() as aiogoogle:
            calendar = await aiogoogle.discover('calendar', 'v3')
            request = calendar.events.insert(calendarId=calendar_id, json=body)
            event = await aiogoogle.as_service_account(request)
        return cast(dict, event)

    async def update_event(
        self,
        event_id: str,
        start: datetime,
        end: datetime,
        timezone: str = 'UTC',
        calendar_id: str = 'primary',
        summary: str | None = None,
        description: str | None = None,
    ) -> dict:
        body: dict = {
            'start': {
                'dateTime': start.isoformat(),
                'timeZone': timezone,
            },
            'end': {
                'dateTime': end.isoformat(),
                'timeZone': timezone,
            },
        }
        if summary:
            body['summary'] = summary
        if description:
            body['description'] = description
        async with self.make_aiogoogle() as aiogoogle:
            calendar = await aiogoogle.discover('calendar', 'v3')
            request = calendar.events.patch(
                calendarId=calendar_id, eventId=event_id, json=body
            )
            event = await aiogoogle.as_service_account(request)
        return cast(dict, event)

    async def delete_event(
        self, event_id: str, calendar_id: str = 'primary'
    ) -> dict | None:
        async with self.make_aiogoogle() as aiogoogle:
            calendar = await aiogoogle.discover('calendar', 'v3')
            request = calendar.events.delete(calendarId=calendar_id, eventId=event_id)
            event = await aiogoogle.as_service_account(request)
        return cast(dict | None, event)


class CalDAVClient:
    def __init__(self, url: str, username: str, password: str) -> None:
        self.client = caldav.DAVClient(url, username=username, password=password)
        self.principal = self.client.principal()

    def get_calendar(self, calendar_id: str) -> Calendar | None:
        for calendar in self.principal.calendars():
            if str(calendar.url).endswith(f'{calendar_id}/'):
                return calendar
        log.error(f'Calendar {calendar_id} not found')
        return None

    def get_event(self, uid: str, calendar_id: str | None = None) -> Event | None:
        if calendar_id:
            calendar = self.get_calendar(calendar_id)
            if calendar:
                return calendar.event_by_uid(uid)
        for calendar in self.principal.calendars():
            try:
                return calendar.event_by_uid(uid)
            except error.NotFoundError:
                continue
        return None

    def list_events(
        self, calendar_id: str, start_date: datetime, end_date: datetime
    ) -> list[Event]:
        calendar = self.get_calendar(calendar_id)
        if not calendar:
            return []
        return calendar.date_search(start=start_date, end=end_date)

    def create_event(
        self,
        calendar_id: str,
        summary: str,
        start: datetime,
        end: datetime,
        description: str,
    ) -> Event | None:
        calendar = self.get_calendar(calendar_id)
        if not calendar:
            return None
        unique_id = str(uuid.uuid4()).upper()
        description = description.replace('\n', '\\n')
        event_data = (
            "BEGIN:VCALENDAR\n"
            "VERSION:2.0\n"
            "PRODID:-//Workbench//Workbench//EN\n"
            "BEGIN:VEVENT\n"
            f"UID:{unique_id}\n"
            f"SUMMARY:{summary}\n"
            f"DTSTART:{start.strftime('%Y%m%dT%H%M%SZ')}\n"
            f"DTEND:{end.strftime('%Y%m%dT%H%M%SZ')}\n"
            f"DESCRIPTION:{description}\n"
            "END:VEVENT\n"
            "END:VCALENDAR"
        )

        event = calendar.save_event(event_data)
        return event

    def update_event(
        self,
        uid: str,
        calendar_id: str | None = None,
        summary: str | None = None,
        start: datetime | None = None,
        end: datetime | None = None,
        description: str | None = None,
    ):
        event = self.get_event(uid=uid, calendar_id=calendar_id)
        if event:
            vevent = event.vobject_instance.vevent
            if summary:
                vevent.summary.value = summary
            if start:
                vevent.dtstart.value = start
            if end:
                vevent.dtend.value = end
            if description:
                vevent.description.value = description
            event.save()
            return event
        return None

    def delete_event(self, uid: str) -> bool:
        event = self.get_event(uid)
        if event:
            event.delete()
            return True
        return False


def get_calendar_client() -> CalDAVClient | None:
    if not CONFIG.CALDAV_URL:
        return None
    return CalDAVClient(
        url=CONFIG.CALDAV_URL,
        username=CONFIG.CALDAV_USERNAME,
        password=CONFIG.CALDAV_PASSWORD,
    )
