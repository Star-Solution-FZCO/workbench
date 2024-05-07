from fastapi import APIRouter, Response

__all__ = ('router',)


router = APIRouter(prefix='/tm/chechmessage.php')


@router.post('')
async def checkmessage() -> Response:
    return Response(
        b'<root></root>',
    )
