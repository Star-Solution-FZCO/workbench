import hashlib
import io
import random
import typing as t
from datetime import datetime
from os.path import join as opj

import aioboto3

from wb.config import CONFIG

__all__ = (
    'upload_file',
    'download_file',
    'gen_hash',
)


def gen_hash(filename: str) -> str:
    return hashlib.sha1(
        f'{datetime.now().timestamp()}-{filename}-{random.random()}'.encode(),  # nosec random
        usedforsecurity=False,
    ).hexdigest()


async def upload_file(
    folder: str,
    filename: str,
    file: t.BinaryIO,
) -> str:
    filepath = opj(folder, filename)
    session = aioboto3.Session(
        aws_access_key_id=CONFIG.S3_ACCESS_KEY,
        aws_secret_access_key=CONFIG.S3_SECRET_KEY,
    )
    async with session.client(
        's3',
        endpoint_url=CONFIG.S3_ENDPOINT,
        region_name=CONFIG.S3_SECRET_KEY,
        use_ssl=CONFIG.S3_VERIFY,
    ) as s3_client:
        await s3_client.upload_fileobj(file, CONFIG.S3_BUCKET, filepath)
    return filepath


async def download_file(
    filepath: str,
) -> t.BinaryIO:
    output = io.BytesIO()
    session = aioboto3.Session(
        aws_access_key_id=CONFIG.S3_ACCESS_KEY,
        aws_secret_access_key=CONFIG.S3_SECRET_KEY,
    )
    async with session.client(
        's3',
        endpoint_url=CONFIG.S3_ENDPOINT,
        region_name=CONFIG.S3_SECRET_KEY,
        use_ssl=CONFIG.S3_VERIFY,
    ) as s3_client:
        await s3_client.download_fileobj(CONFIG.S3_BUCKET, filepath, output)
    output.seek(0)
    return output
