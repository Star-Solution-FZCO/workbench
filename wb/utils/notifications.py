from wb.config import CONFIG
from wb.tasks import task_send_email

__all__ = ('send_notification_to_people_project',)


async def send_notification_to_people_project(subject: str, msg: str) -> None:
    if not CONFIG.NOTIFICATION_PEOPLE_PROJECT_EMAIL:
        return
    task_send_email.delay(
        CONFIG.SMTP_SENDER, (CONFIG.NOTIFICATION_PEOPLE_PROJECT_EMAIL,), subject, msg
    )
