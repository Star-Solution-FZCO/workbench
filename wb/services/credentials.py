import ssl
from dataclasses import dataclass
from enum import IntEnum
from typing import Any

import aiohttp
from pydantic import BaseModel

from wb.config import CONFIG
from wb.log import log

__all__ = (
    'CredentialsNotificationType',
    'CredentialsNotification',
    'BundleConfig',
    'credentials_service',
)


class CredentialsNotificationType(IntEnum):
    EMAIL = 1
    SMS = 2
    TELEGRAM = 3
    PARARAM = 4


class CredentialsNotification(BaseModel):
    type: CredentialsNotificationType
    value: str


@dataclass(frozen=True)
class BundleConfig:
    openvpn: bool = False
    ssh: bool = False
    certificate: bool = False
    pvpn: bool = False


ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
ssl_context.load_verify_locations(CONFIG.CREDENTIALS_SERVICE_CERT_PATH)
ssl_context.verify_mode = ssl.CERT_REQUIRED
ssl_context.load_cert_chain(
    CONFIG.CREDENTIALS_SERVICE_CERT_PATH, CONFIG.CREDENTIALS_SERVICE_CERT_PATH
)
ssl_context.check_hostname = not CONFIG.DEV_MODE


class CredentialsService:
    def __init__(self, url) -> None:
        self.url = url

    async def post(
        self, endpoint: str, data: Any, headers: dict[str, str] | None = None
    ):
        url = f'{self.url}{endpoint}'
        default_headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
        if headers:
            default_headers.update(headers)
        connector = aiohttp.TCPConnector(ssl_context=ssl_context)
        try:
            async with aiohttp.ClientSession(
                headers=default_headers, connector=connector
            ) as session:
                async with session.post(url=url, json=data) as response:
                    response.raise_for_status()
                    return await response.json()
        except Exception as err:  # pylint: disable=broad-exception-caught
            log.error(f'request to {url} failed with error={err}')
            return None

    async def arm_credentials(
        self,
        notifications: list[CredentialsNotification],
        subject: str,
        bundle: BundleConfig,
        name: str,
        ca: int = 0,
    ):
        data = {
            'notifications': notifications,
            'ca': ca,
            'subject': subject,
            'type': 'credentials',
            'bundle': bundle,
            'name': name,
            'source': 'workbench',
        }
        return await self.post('/api/v1/credentials/arm', data)

    async def disarm_credentials_arm(self, rid: str):
        return await self.post('/api/v1/credentials/disarm', {'rid': rid})

    async def get_credentials(self, subject: str, rid: str, password: str):
        headers = {
            'Accept': 'application/octet-stream',
        }
        data = {
            'subject': subject,
            'rid': rid,
            'password': password,
        }
        return await self.post('/api/v1/credentials', data, headers)


credentials_service = CredentialsService(CONFIG.CREDENTIALS_SERVICE_URL)
