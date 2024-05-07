import ssl
from typing import Literal
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from wb.celery_app import celery_app
from wb.config import CONFIG

__all__ = ('task_send_bbot_message',)

Recipient = Literal['user', 'chat']


def _send_message(
    identificator: str, message: str, recipient: Recipient = 'user'
) -> None:
    if CONFIG.SEND_NOTIFICATION_TO_CONSOLE:
        print(f'SEND BBOT MESSAGE to {recipient} - {identificator}, txt: {message}')
        return
    headers = {'X-API-KEY': CONFIG.BBOT_API_TOKEN}
    url = CONFIG.BBOT_API_URL
    if recipient == 'user':
        url += f'/send/user?pararam={identificator}'
    if recipient == 'chat':
        url += f'/send/chat?chat_id={identificator}'
    data = urlencode({'message': message}).encode()
    req = Request(url, data=data, headers=headers, method='PUT')
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    try:
        with urlopen(req, context=ctx):
            pass
    except HTTPError as err:
        print(f'{url}: {err.status}: {str(err.read())}')


@celery_app.task(name='send_bbot_message')
def task_send_bbot_message(
    identificator: str, message: str, recipient: Recipient = 'user'
) -> None:
    print(f'trying to send message to {recipient} - {identificator}')
    _send_message(identificator=identificator, message=message, recipient=recipient)
