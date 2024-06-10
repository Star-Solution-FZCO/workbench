import os

from fastapi import APIRouter
from pydantic import BaseModel

from wb.schemas import SuccessPayloadOutput
from wb.utils.query import make_success_output

__all__ = ('router',)

router = APIRouter(prefix='/api/v1/version', tags=['v1', 'version'])


class VersionOut(BaseModel):
    version: str


@router.get('')
async def get_version() -> SuccessPayloadOutput[VersionOut]:
    version = os.environ.get('APP_VERSION', '__DEV__')
    return make_success_output(payload=VersionOut(version=version))
