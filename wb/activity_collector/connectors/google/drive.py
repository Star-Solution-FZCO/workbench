from typing import Any, Dict

from .base import GoogleReportConnector

__all__ = ('GoogleDriveConnector',)


class GoogleDriveConnector(GoogleReportConnector):
    _event_parameters = ('doc_type', 'doc_id')
    _ignored_action = (
        'access_url',
        'view',
        'download',
        'storage_usage_update',
        'change_document_visibility',
        'change_document_access_scope',
        'change_user_access',
        'sheets_import_range_access_change',
    )

    def create_link(self, parameters: Dict[str, Any]) -> str:
        if parameters['doc_type'] == 'document':
            return f'https://docs.google.com/document/d/{parameters["doc_id"]}'
        if parameters['doc_type'] == 'spreadsheet':
            return f'https://docs.google.com/spreadsheets/d/{parameters["doc_id"]}'
        return ''

    def create_target_id(self, parameters: Dict[str, Any]) -> str:
        return parameters['doc_id']  # type: ignore
