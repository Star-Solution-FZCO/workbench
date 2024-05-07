from fastapi import APIRouter, HTTPException, UploadFile
from pydantic import BaseModel

from wb.schemas import SuccessPayloadOutput
from wb.utils.query import make_success_output
from wb.utils.storage import gen_hash, upload_file

__all__ = ('router',)

router = APIRouter(prefix='/api/v1/upload', tags=['v1', 'upload'])

ALLOWED_PREFIXES = ('attachment',)


class UploadOutput(BaseModel):
    url: str


@router.post('/{prefix}')
async def upload_attachment(
    prefix: str, file: UploadFile
) -> SuccessPayloadOutput[UploadOutput]:
    if prefix not in ALLOWED_PREFIXES:
        raise HTTPException(403, f'upload {prefix} denied')
    filehash = gen_hash(file.filename if file.filename else 'tmp')
    filepath = await upload_file(prefix, filehash, file.file)
    return make_success_output(payload=UploadOutput(url=filepath))
