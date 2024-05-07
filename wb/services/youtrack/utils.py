import io
import json
import mimetypes
import uuid
from http.client import HTTPResponse
from typing import Any, Callable, Generator, Iterable, cast
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, build_opener

from wb.services.youtrack.types import (
    CommandLimitedVisibilityT,
    CustomFieldListT,
    FieldsT,
    JsonT,
    ParsedCustomFieldT,
)

HeadersLikeT = dict[str, str]

NAME = 'YOUTRACK'
VERSION = '1.0.0'
TIMEOUT = 60
DEFAULT_HEADERS: HeadersLikeT = {
    'User-Agent': f'wb-help-center-{NAME}/{VERSION}',
}


ISSUE_CAN_BE_SINGLE_OR_MULTI = {
    'BuildIssueCustomField': None,
    'EnumIssueCustomField': None,
    'GroupIssueCustomField': None,
    'OwnedIssueCustomField': None,
    'UserIssueCustomField': None,
    'VersionIssueCustomField': None,
}


class ProcessorAbortException(Exception):
    cause: str

    def __init__(self, msg: str, cause: str):
        self.cause = cause
        super().__init__(msg)


class YoutrackException(Exception):
    pass


class YoutrackUserNotFound(YoutrackException):
    pass


class YoutrackTooManyAccounts(YoutrackException):
    pass


def base_request(
    url: str,
    token: str,
    method: str = 'GET',
    data: bytes | None = None,
    headers: HeadersLikeT | None = None,
    timeout: int = TIMEOUT,
) -> HTTPResponse:
    _headers = DEFAULT_HEADERS
    if headers:
        _headers = {**_headers, **headers}
    _headers['Authorization'] = f'Bearer {token}'
    opener = build_opener()
    _data = None
    if data:
        _data = data
    req = Request(url, _data, method=method, headers=_headers)
    try:
        res: HTTPResponse = opener.open(req, timeout=timeout)
        return res
    except HTTPError as e:  # pylint: disable=try-except-raise
        print(e)
        raise


def json_request(
    url: str,
    token: str,
    method: str = 'GET',
    data: Any = None,
    headers: HeadersLikeT | None = None,
    timeout: int = TIMEOUT,
) -> dict:
    if headers is None:
        headers = {}
    headers = {
        **headers,
        **{'Content-Type': 'application/json', 'Accept': 'application/json'},
    }
    if data is not None:
        data = json.dumps(data).encode()
    response = base_request(url, token, method, data, headers, timeout)
    return cast(dict, json.loads(response.read()))


def load_generator(client: Callable, url: str, per_request: int = 0) -> Generator:
    symbol = '?'
    if '?' in url:
        symbol = '&'
    cnt: int = 0
    loaded = False

    def load() -> JsonT:
        nonlocal loaded
        loaded = True
        return cast(
            JsonT, client(f'{url}{symbol}$skip={per_request * cnt}&$top={per_request}')
        )

    res = load()
    while loaded:
        loaded = False
        cur: int = 0
        for _, r in enumerate(res):
            cur += 1
            yield r
        if not cur or cur < per_request:
            break
        cnt += 1
        res = load()


def load_with_key_generator(
    client: Callable, url: str, key: str, per_request: int = 0
) -> Generator:
    symbol = '?'
    if '?' in url:
        symbol = '&'
    cnt: int = 0
    cur: int = 0

    def load() -> JsonT:
        return cast(
            JsonT, client(f'{url}{symbol}$skip={per_request * cnt}&$top={per_request}')
        )

    res = load()
    total = res.get('total', 0)
    while total:
        for _, r in enumerate(res.get(key, [])):
            cur += 1
            yield r
        if not cur or cur >= total:
            break
        cnt += 1
        res = load()


def make_args(
    query: str | None = None,
    fields: FieldsT | None = None,
    skip: int | None = None,
    top: int | None = None,
) -> str:
    args = []
    if fields:
        args += [urlencode({'fields': ','.join(map(trim, fields))})]
    if skip:
        args += [f'$skip={skip}']
    if top:
        args += [f'$top={top}']
    if query:
        args += [urlencode({'query': query})]
    return '&'.join(args)


def trim(text: str) -> str:
    return text.lstrip(' ').rstrip(' ')


def build_url(
    url: str,
    query: str | None = None,
    fields: FieldsT | None = None,
    skip: int | None = None,
    top: int | None = None,
) -> str:
    args = make_args(query, fields, skip, top)
    if args:
        return f'{url}?{args}'
    return url


def parse_field(
    fields: list[dict[str, Any]], _filter: Iterable
) -> dict[str, ParsedCustomFieldT]:
    result: dict[str, ParsedCustomFieldT] = {}
    for f in fields:
        field = f.get('field', {})
        name = field.get('name', None)
        if not _filter or name in _filter:
            type_ = field.get('fieldType', {}).get('id')
            result[name] = {
                'name': name,
                'updateable': field.get('isUpdateable'),
                'issue_type': f['$type'].replace('Project', 'Issue'),
                'type': type_[:-3],
                'multi': type_[-2] == '*',
            }
    return result


def gen_value(_type: str, value: Any, simple: bool = True, multi: bool = False) -> Any:
    key = None
    if not simple:
        key = 'name'
        if _type == 'user':
            key = 'login'
        if _type == 'per':
            key = 'presentation'
    result = value if key is None else {key: value}
    if multi:
        if isinstance(value, (list, tuple)):
            return [gen_value(_type, v, simple, multi=False) for v in value]
        return [result]
    return result


def gen_field(field: ParsedCustomFieldT, value: Any) -> dict[str, Any]:
    type_ = field['issue_type']
    if type_ in ISSUE_CAN_BE_SINGLE_OR_MULTI:
        prefix = 'Single'
        if field['multi']:
            prefix = 'Multi'
        type_ = f'{prefix}{type_}'
    return {
        'name': field['name'],
        '$type': type_,
        'value': gen_value(
            field['type'],
            value,
            field['issue_type'] == 'SimpleIssueCustomField',
            field['multi'],
        ),
    }


def make_fields(
    custom_fields: list[CustomFieldListT], fields: list
) -> list[dict[str, Any]]:
    parsed = parse_field(fields, _filter=[n for n, _ in custom_fields])
    data = []
    for name, value in custom_fields:
        if name not in parsed:
            raise YoutrackException(f'no field named "{name}" in project')
        field = parsed[name]
        if not field['updateable']:
            raise YoutrackException(
                f'insufficient permissions to update field "{name}"'
            )
        data += [gen_field(field, value)]
    return data


def make_visibility(
    visibility: 'CommandLimitedVisibilityT', get_self_profile: Callable[[], 'str']
) -> dict[str, Any]:
    users = []
    for u in visibility.get('permittedUsers', []):
        if isinstance(u, str) and u == 'me':
            id_ = get_self_profile()
        else:
            id_ = u['id']
        users += [{'id': id_}]
    return {
        '$type': 'CommandLimitedVisibility',
        'permittedGroups': [
            {'id': u['id']} for u in visibility.get('permittedGroups', [])
        ],
        'permittedUsers': users,
    }


class MultiPartForm:
    form_fields: list[tuple[str, str]]
    files: list[tuple[str, str, str, Any]]
    boundary: bytes

    def __init__(self) -> None:
        self.form_fields = []
        self.files = []
        self.boundary = uuid.uuid4().hex.encode('utf-8')

    def get_content_type(self) -> str:
        return f'multipart/form-data; boundary={self.boundary.decode("utf-8")}'

    def add_field(self, name: str, value: str) -> None:
        self.form_fields.append((name, value))

    def add_file(
        self,
        fieldname: str,
        filename: str,
        filehandle: Any,
        mimetype: str | None = None,
    ) -> None:
        body = filehandle.read()
        if mimetype is None:
            mimetype = mimetypes.guess_type(filename)[0] or 'application/octet-stream'
        self.files.append((fieldname, filename, mimetype, body))

    @staticmethod
    def _form_data(name: str) -> bytes:
        return f'Content-Disposition: form-data; name="{name}"\r\n'.encode('utf-8')

    @staticmethod
    def _attached_file(name: str, filename: str) -> bytes:
        return f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'.encode(
            'utf-8'
        )

    @staticmethod
    def _content_type(content_type: str) -> bytes:
        return f'Content-Type: {content_type}\r\n'.encode('utf-8')

    def __bytes__(self) -> bytes:
        buffer = io.BytesIO()
        boundary = b'--' + self.boundary + b'\r\n'

        for name, value in self.form_fields:
            buffer.write(boundary)
            buffer.write(self._form_data(name))
            buffer.write(b'\r\n')
            buffer.write(value.encode('utf-8'))
            buffer.write(b'\r\n')

        for f_name, filename, f_content_type, body in self.files:
            buffer.write(boundary)
            buffer.write(self._attached_file(f_name, filename))
            buffer.write(self._content_type(f_content_type))
            buffer.write(b'\r\n')
            buffer.write(body)
            buffer.write(b'\r\n')

        buffer.write(b'--' + self.boundary + b'--\r\n')
        return buffer.getvalue()
