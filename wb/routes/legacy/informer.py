import os

from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from shared_utils.file import async_iter_file
from timetracking.config import TM_CLIENT_DIR, TM_CLIENT_VERSION
from timetracking.db import get_tm_db_session
from wb.db import get_db_session

from ._base import HEADERS, auth_tm_user

__all__ = ('router',)


router = APIRouter(prefix='/tm/informer.php')

TM_FILE_NAME = 'latesttm.exe'


XML_TREE = """<root>
<View name="MacroTaskItem" List="1" Menu="1" Flags="32768"/>
<View name="TaskItem" List="1" Menu="1" Flags="16384"/>
<View name="MyTasks" List="1" Flags="512"/>
<View name="MyUnapprovedTasks" List="1" Menu="1" Flags="512"/>
<View name="MyDNCTasks" List="1" Menu="1" Flags="512"/>
<View name="MyExpiredTasks" List="1" Menu="1" Flags="512"/>
<View name="DoneTasks" List="1" Menu="1" />
<View name="Messages" Menu="1" List="1" Flags="512"/>
<View name="Project" Menu="1" List="1" />
<View name="Send" Menu="1" />
<MenuItem title="View presence" reference="" Flags="0x2000"/>
<Separator/>
<UsersItem title="Users"   reference="" context="1" uniqueID="Users">
<MyUsers>
</MyUsers>
</UsersItem>
<Separator/>
<MenuItem title="Status"   reference="%%Status%%" />
<Separator/>
<MenuItem title="Refresh"   reference="%%Refresh%%" />
<Separator/>
<MenuItem title="Configure"   reference="%%Configure%%" />
<MenuItem title="Kill TaskManager"   reference="%%Close%%" />
</root>"""


@router.post('')
async def informer(
    req: Request,
    session: AsyncSession = Depends(get_db_session),
    tm_session: AsyncSession = Depends(get_tm_db_session),
) -> Response:
    # pylint: disable=too-many-return-statements
    body = await req.form()
    todo = body.get('todo')
    if todo == 'checkVersion':
        try:
            version = int(body.get('version'))  # type: ignore
            if version < TM_CLIENT_VERSION:
                return Response(
                    b'old',
                    headers=HEADERS,
                )
            return Response(
                b'new',
                headers=HEADERS,
            )
        except (TypeError, ValueError):
            pass
    if todo == 'getVersion':
        tm_file_path = os.path.join(TM_CLIENT_DIR, TM_FILE_NAME)
        if not os.path.exists(tm_file_path):
            return Response(
                b'No installer found!',
                headers=HEADERS,
            )
        tm_file_size = os.path.getsize(tm_file_path)
        return StreamingResponse(
            async_iter_file(tm_file_path),
            headers={
                'Pragma': 'no-cache',
                'Expires': '0',
                'Cache-Control': 'must-revalidate, post-check=0, pre-check=0',
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': f'attachment; filename="{TM_FILE_NAME}"',
                'Content-Length': str(tm_file_size),
                'Content-Transfer-Encoding': 'binary',
            },
        )
    emp = await auth_tm_user(body, session=session, tm_session=tm_session)
    if not emp:
        return Response(
            b'invalid!',
            headers=HEADERS,
        )
    if todo == 'login':
        return Response(
            b'OK',
            headers=HEADERS,
        )

    return Response(
        XML_TREE.encode(),
    )
