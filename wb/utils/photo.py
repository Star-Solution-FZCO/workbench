import asyncio
import hashlib
import io
import typing as t
from os.path import splitext

from PIL import Image, ImageDraw, ImageFont

from wb.utils.storage import gen_hash, upload_file

__all__ = (
    'upload_photo',
    'get_photo_path',
    'UploadPhotoException',
    'IMAGE_SIZES',
    'generate_default_photo',
)


FONT_PATH = 'FreeSans.ttf'
ALLOWED_FORMATS = (
    'png',
    'jpg',
    'jpeg',
)
IMAGE_SIZES = (100, 200, 400)
MAX_IMAGE_SIZE = max(IMAGE_SIZES)
S3_PHOTO_FOLDER = 'photo'


class UploadPhotoException(Exception):
    pass


def _resize(img: Image.Image, size: int) -> t.BinaryIO:
    result = img.copy()
    result = result.resize((size, size), Image.Resampling.LANCZOS)
    output = io.BytesIO()
    result.save(output, img.format)
    output.seek(0)
    return output


def get_photo_path(filepath: str, size: int | None = None) -> str:
    if size is None:
        return filepath
    if size not in IMAGE_SIZES:
        raise ValueError('wrong size')
    base, ext = splitext(filepath)
    return f'{base}_{size}{ext}'


async def upload_photo(filename: str, file: t.BinaryIO) -> str:
    s3_basename = gen_hash(filename)
    try:
        img = Image.open(file)
    except IOError as err:
        raise UploadPhotoException('Can not read image') from err
    file.seek(0)
    if img.format.lower() not in ALLOWED_FORMATS:
        raise UploadPhotoException(f'Wrong image format, allowed = {ALLOWED_FORMATS}')
    await upload_file(S3_PHOTO_FOLDER, f'{s3_basename}.{img.format.lower()}', file)
    resized = {size: _resize(img, size) for size in IMAGE_SIZES}
    await asyncio.gather(
        *[
            upload_file(
                S3_PHOTO_FOLDER, f'{s3_basename}_{size}.{img.format.lower()}', output
            )
            for size, output in resized.items()
        ]
    )
    return f'{S3_PHOTO_FOLDER}/{s3_basename}.{img.format.lower()}'


def generate_default_photo(
    emp_id: int,
    emp_english_name: str,
    size: int = MAX_IMAGE_SIZE,
) -> t.BinaryIO:
    str_hash = hashlib.md5(
        f'{emp_id}_{emp_english_name}'.encode(), usedforsecurity=False
    ).digest()
    msg = ''.join(list(map(lambda s: s[0:1], emp_english_name.split(' ')))[0:2])
    color = (
        str_hash[0],
        str_hash[1],
        str_hash[2],
    )
    img = Image.new(
        mode='RGB',
        size=(
            size,
            size,
        ),
        color=color,
    )
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT_PATH, size=int(size * 0.5))
    _, _, width, height = draw.textbbox((0, 0), msg, font=font)
    draw.text(
        ((size - width) / 2, (size - height) / 2),
        msg,
        font=font,
        fill=(
            255,
            255,
            255,
        ),
    )
    output = io.BytesIO()
    img.save(output, 'JPEG')
    output.seek(0)
    return output
