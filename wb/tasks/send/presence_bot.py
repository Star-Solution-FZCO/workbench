from pararamio import PararamioBot
from pararamio.exceptions import PararamioException

from wb.celery_app import celery_app
from wb.config import CONFIG

__all__ = ('task_send_presence_bot_message',)


def _send_message(chat_id: int, message: str) -> None:
    if CONFIG.SEND_NOTIFICATION_TO_CONSOLE:
        print(f'SEND PRESENCE BOT MESSAGE to {chat_id}, txt: {message}')
        return
    pararam_bot = PararamioBot(CONFIG.PRESENCE_BOT_PARARAM_KEY)
    try:
        pararam_bot.post_message(chat_id, message)
    except PararamioException as err:
        print(f'presence_bot failed to send message to {chat_id}: {err}')


@celery_app.task(name='send_presence_bot_message')
def task_send_presence_bot_message(chat_id: int, message: str) -> None:
    print(f'presence_bot trying to send message to {chat_id}')
    _send_message(chat_id, message)
