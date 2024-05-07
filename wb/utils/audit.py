# pylint: skip-file
import os
import pickle
import typing as t

import sqlalchemy as sa
from sqlalchemy.event import listens_for
from sqlalchemy.orm.base import MANYTOMANY

import wb.models as m

from .current_user import current_employee

__all__ = ()


AUDITED_MODELS = (
    m.Organization,
    m.Team,
    m.Employee,
    m.Position,
    m.HolidaySet,
    m.CooperationType,
    m.Policy,
    m.Portal,
    m.PortalGroup,
    m.Service,
    m.TeamTag,
    m.CounterAgent,
)

ActionT = t.Literal['INSERT', 'UPDATE', 'DELETE']


def get_manytomany_relations(cls: t.Any) -> dict[str, str | None]:
    # Returns {key: remote_side_key}
    def determine_remote_side_key(attr: t.Any) -> str | None:
        keys = [r.foreign_keys for r in attr.remote_side]
        if len([l for l in keys for l in l]) > 1:
            return 'id'
        return None

    attrs = list(
        filter(
            lambda a: getattr(a, 'direction', None) == MANYTOMANY, sa.inspect(cls).attrs
        )
    )
    return {a.key: determine_remote_side_key(a) for a in attrs}


def create_entry(target: t.Any, action: ActionT, connection: t.Any) -> None:
    changes = {}
    state = sa.inspect(target)
    inspection = sa.inspect(target.__class__)
    _manytomany = get_manytomany_relations(target.__class__)
    _rel_keys = [r.key for r in inspection.relationships]
    for attr in filter(
        lambda a: a.key in _manytomany or a.key not in _rel_keys, state.attrs
    ):
        hist = state.get_history(attr.key, True)
        if action not in ['INSERT'] and not hist.has_changes():
            continue
        if attr.key in _manytomany:
            _r_key = _manytomany[attr.key]
            added = list(map(lambda a: getattr(a, _r_key), hist.added))  # type: ignore[arg-type]
            if hist.unchanged:
                added += list(map(lambda a: getattr(a, _r_key), hist.unchanged))  # type: ignore[arg-type]
            changes.update(
                audit_change_entry(
                    attr.key,
                    added,
                    list(map(lambda a: getattr(a, _r_key), hist.deleted)),  # type: ignore[arg-type]
                )
            )
            continue
        added = list(hist.added)
        if hist.unchanged:
            added += list(hist.unchanged)
        changes.update(audit_change_entry(attr.key, added, list(hist.deleted)))
    if not changes:
        return
    curr_user = current_employee()
    params = {
        'object_id': target.id,
        'table_name': target.__table__.name,
        'class_name': target.__class__.__name__,
        'fields': list(changes.keys()),
        'action': action,
        'data': pickle.dumps(changes),
        'user_id': curr_user.id,
    }
    r = connection.execute(m.AuditEntry.__table__.insert().values(**params))  # type: ignore[attr-defined]
    if not r.rowcount:
        raise Exception('audit record insertion failed')


def audit_change_entry(
    name: str, added: t.Any, deleted: t.Any
) -> dict[str, dict[str, t.Any]]:
    return {name: {'added': added, 'deleted': deleted}}


if os.getenv('ALLOW_CHANGE_AUDIT_RECORDS', 'f') != 't':
    # noinspection PyUnusedLocal
    @listens_for(m.AuditEntry, 'before_update')
    def receive_before_update(mapper, connection, target):  # type: ignore[no-untyped-def]
        raise PermissionError('log entry can not be updated')

    # noinspection PyUnusedLocal
    @listens_for(m.AuditEntry, 'before_delete')
    def receive_before_delete(mapper, connection, target):  # type: ignore[no-untyped-def]
        raise PermissionError('log entry can not be deleted')


for model in AUDITED_MODELS:

    @listens_for(model, 'before_update', propagate=True)
    def receive_before_update(mapper, connection, target):  # type: ignore[no-untyped-def]
        state = sa.inspect(target)
        history = [state.get_history(a.key, True) for a in state.attrs]
        changed = [h for h in history if h.added or h.deleted]
        if changed:
            target.up_revision()

    @listens_for(model, 'after_insert', propagate=True)
    def receive_after_insert(mapper, connection, target):  # type: ignore[no-untyped-def]
        create_entry(target, 'INSERT', connection)

    @listens_for(model, 'after_update', propagate=True)
    def receive_after_update(mapper, connection, target):  # type: ignore[no-untyped-def]
        create_entry(target, 'UPDATE', connection)

    @listens_for(model, 'after_delete', propagate=True)
    def receive_after_delete(mapper, connection, target):  # type: ignore[no-untyped-def]
        create_entry(target, 'DELETE', connection)
