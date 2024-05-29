import json
from typing import Any, cast
from xml.etree import ElementTree as ET

import aiohttp

from wb.config import CONFIG
from wb.log import log
from wb.schemas.params import ConfluenceAPIParams, ConfluenceSearchParams

__all__ = ('confluence_api', 'confluence_xml_converter')


class ConfluenceXMLConverter:
    def __init__(self) -> None:
        self.__prefix_alias = 'ct'

    def get_deepest_xml_el_text(self, element: ET.Element) -> str:
        if element.tag == 'a':
            return ET.tostring(element, 'unicode')
        if len(element) == 0:
            return element.text if element.text else ''
        if element.text:
            return element.text
        return self.get_deepest_xml_el_text(element[0])

    def __convert_task_list(self, root: ET.Element, level: int = 0) -> str:
        markdown = ''
        for task in root.findall(f'./{{{self.__prefix_alias}}}task'):
            body = task.find(f'{{{self.__prefix_alias}}}task-body')
            text = self.get_deepest_xml_el_text(body) if body else ''
            markdown += ' ' * level * 2 + f'- [ ] {text.strip()}\n'
            if body:
                for sublist in body.findall(f'./{{{self.__prefix_alias}}}task-list'):
                    markdown += self.__convert_task_list(sublist, level + 1)
        return markdown

    def to_markdown(self, content: str) -> str:
        content = content.replace('\\n', '').replace('\\', '')
        try:
            markdown = ''
            root = ET.fromstringlist(
                [
                    f'<root xmlns:ac="{self.__prefix_alias}" xmlns:ri="{self.__prefix_alias}">',
                    content,
                    '</root>',
                ]
            )
            for task_list in root.findall('./{ct}task-list'):
                markdown += self.__convert_task_list(task_list)
            return markdown
        except Exception as e:  # pylint: disable=broad-exception-caught
            log.debug(e)
            return ''


class ConfluenceRestAPI:
    __api_url: str
    __api_token: str

    def __init__(self, api_url: str, api_token: str):
        self.__api_url = api_url
        self.__api_token = api_token

    def make_cql(self, keyword: str, space_keys: list[str]) -> str:
        cql = f'siteSearch ~ "{keyword}" AND type in ("page","blogpost")'
        if len(space_keys) > 0:
            spaces = ','.join(space_keys)
            cql += f' AND space in ({spaces})'
        return cql

    async def get(self, endpoint: str, params: dict[str, Any]) -> Any:
        url = f'{self.__api_url}{endpoint}'
        headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.__api_token}',
        }
        try:
            async with aiohttp.ClientSession(headers=headers) as session:
                async with session.get(url, ssl=False, params=params) as response:
                    data = await response.read()
                    return json.loads(data)
        except Exception as err:  # pylint: disable=broad-exception-caught
            print(f'{err}')
            log.error(f'request to {url} failed with error={err}')
            return None

    async def search(
        self, _params: ConfluenceSearchParams, space_keys: list[str]
    ) -> dict[str, Any] | None:
        params = {
            'cql': self.make_cql(_params.query, space_keys),
            'start': _params.start,
            'limit': _params.limit,
        }
        res: dict[str, Any] | None = await self.get('/search', params=params)
        return res

    async def list_space(self, params: ConfluenceAPIParams) -> dict[str, Any]:
        _params = {
            'start': params.start,
            'limit': params.limit,
        }
        res: dict[str, Any] = await self.get('/space', params=_params)
        return res

    async def get_page_content(self, page_id: str) -> str | None:
        params = {'expand': 'body.storage'}
        res: dict[str, Any] = await self.get(f'/content/{page_id}', params=params)
        content = res.get('body', {}).get('storage', {}).get('value')
        return cast(str | None, content)


confluence_xml_converter = ConfluenceXMLConverter()

confluence_api = None  # pylint: disable=invalid-name
if CONFIG.CONFLUENCE_URL:
    confluence_api = ConfluenceRestAPI(
        CONFIG.CONFLUENCE_URL, CONFIG.CONFLUENCE_API_TOKEN
    )
