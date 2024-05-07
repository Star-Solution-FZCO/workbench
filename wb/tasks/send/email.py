import smtplib
from base64 import b64decode
from email.encoders import encode_base64
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formatdate
from typing import Dict, Optional, Sequence

from wb.celery_app import celery_app
from wb.config import CONFIG

__all__ = ('task_send_email',)


def _send_email(
    sender: str,
    recipients: Sequence[str],
    subject: str,
    body: str,
    attachments: Optional[Dict[str, str]] = None,
) -> None:
    if CONFIG.SEND_NOTIFICATION_TO_CONSOLE:
        print(
            f'SEND EMAIL to: {recipients}, from: {sender}, subj: {subject}, txt: {body}'
        )
        return
    if not attachments:
        attachments = {}
    try:
        if CONFIG.SMTP_SSL_MODE and CONFIG.SMTP_SSL_MODE in ('tls', 'ssl'):
            mail_client: smtplib.SMTP | smtplib.SMTP_SSL = smtplib.SMTP_SSL(
                CONFIG.SMTP_HOST, CONFIG.SMTP_PORT
            )
        else:
            mail_client = smtplib.SMTP(CONFIG.SMTP_HOST, CONFIG.SMTP_PORT)
        mail_client.ehlo()
        if CONFIG.SMTP_LOGIN:
            mail_client.login(CONFIG.SMTP_LOGIN, CONFIG.SMTP_PASSWORD)
        msg = MIMEMultipart()
        msg['Subject'] = subject
        msg['To'] = ', '.join(recipients)
        msg['From'] = sender
        msg['Date'] = formatdate()
        msg.attach(MIMEText(body, 'html'))
        for name, data in attachments.items():
            attachment = MIMEBase('application', 'octet-stream')
            attachment.set_payload(b64decode(data.encode()))
            encode_base64(attachment)
            attachment.add_header(
                'Content-Disposition', f'attachment; filename="{name}"'
            )
            msg.attach(attachment)
        mail_client.sendmail(sender, recipients, msg.as_string())
        mail_client.close()
    except Exception as err:  # pylint: disable=broad-exception-caught
        print(
            f'sending email failed (subject = {subject}, recipients={recipients}) with error = {err}'
        )


@celery_app.task(name='send_email')
def task_send_email(
    sender: str,
    recipients: Sequence[str],
    subject: str,
    body: str,
    attachments: Optional[Dict[str, str]] = None,
) -> None:
    print(f'trying to send email to {recipients}')
    _send_email(sender, recipients, subject, body, attachments)
