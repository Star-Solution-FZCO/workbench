import typing as t
from datetime import date

import pyparsing as pp
import sqlalchemy.sql.operators as so
from sqlalchemy.ext.associationproxy import ColumnAssociationProxyInstance
from sqlalchemy.sql import func

__all__ = (
    'filter_to_query',
    'sort_to_query',
)

AVAILABLE_OPERATORS = [
    'eq',
    'ne',
    'in',
    'nin',
    'lt',
    'le',
    'lte',
    'ge',
    'gt',
    'gte',
    'contains',
    'icontains',
]
AVAILABLE_OPERATORS_STRING = ' '.join(AVAILABLE_OPERATORS)


def get_parser() -> t.Callable[[str, bool], pp.ParseResults]:
    # pylint: disable=pointless-statement, expression-not-assigned
    op_or = pp.Forward()
    operator_field = pp.Group(
        pp.Word(pp.alphanums + '$')
        + pp.ZeroOrMore(pp.Char('_') + pp.Word(pp.alphanums))
    ).setResultsName('field_name')
    operator_word = pp.Group(
        operator_field
        + pp.Optional(pp.OneOrMore(pp.Suppress('__') + operator_field))
        + pp.Optional(
            pp.Group(
                pp.Suppress('___') + pp.oneOf(AVAILABLE_OPERATORS_STRING)
            ).setResultsName('operator')
        )
        + pp.Suppress(':')
        + pp.Group(
            pp.delimitedList(pp.QuotedString('"') | pp.Word(pp.alphanums + '_'))
        ).setResultsName('value')
    ).setResultsName('word')

    operator_quotes_content = pp.Forward()
    operator_quotes_content << (
        (operator_word + operator_quotes_content) | operator_word
    )

    operator_parenthesis = (
        pp.Group(pp.Suppress('(') + op_or + pp.Suppress(')')).setResultsName(
            'parenthesis'
        )
        | operator_word
    )

    op_not = pp.Forward()
    op_not << (
        pp.Group(pp.Keyword('not', caseless=True) + op_not).setResultsName('not')
        | operator_parenthesis
    )

    op_and = pp.Forward()
    op_and << (
        op_not + pp.Keyword('and', caseless=True) + op_and
        | op_not + pp.OneOrMore(~pp.oneOf('and or') + op_and)
        | op_not
    )

    op_or << (op_and + pp.Keyword('or', caseless=True) + op_or | op_and)
    return op_or.parse_string  # type: ignore


SEARCH_PARSE_STRING = get_parser()


OPERATORS = {
    'AND': so.and_,
    'NOT': so.is_not,
    'OR': so.or_,
}
DEFAULT_OPERATOR = so.and_

OPERATOR_TO_TYPE: t.Dict[str, t.Dict[str, t.Any]] = {
    'bool': {
        'default': lambda f, s: so.eq(f, not s.lower() == 'false'),
    },
    'str': {
        'in': lambda f, s: so.in_op(f, [s] if isinstance(s, str) else s),
        'nin': lambda f, s: so.not_in_op(f, [s] if isinstance(s, str) else s),
        'contains': lambda f, s: so.contains_op(f, f'%{s}%'),
        'icontains': lambda f, s: so.icontains_op(f, f'%{s}%'),
        'default': lambda f, s: so.eq(f, s if s != 'null' else None),
        'ne': lambda f, s: so.ne(f, s if s != 'null' else None),
    },
    'int': {
        'in': lambda f, s: so.in_op(
            f, [int(s)] if isinstance(s, str) else [int(n) for n in s]
        ),
        'nin': lambda f, s: so.not_in_op(
            f, [int(s)] if isinstance(s, str) else [int(n) for n in s]
        ),
        'default': lambda f, s: so.eq(f, int(s) if s != 'null' else None),
    },
    'datetime': {
        'lt': so.lt,
        'gt': so.gt,
        'le': so.le,
        'lte': so.le,
        'ge': so.ge,
        'gte': so.ge,
        'default': lambda f, s: so.eq(f, s if s != 'null' else None),
    },
    'date': {
        'lt': lambda f, s: so.lt(f, date.fromisoformat(s)),
        'gt': lambda f, s: so.gt(f, date.fromisoformat(s)),
        'le': lambda f, s: so.le(f, date.fromisoformat(s)),
        'lte': lambda f, s: so.le(f, date.fromisoformat(s)),
        'ge': lambda f, s: so.ge(f, date.fromisoformat(s)),
        'gte': lambda f, s: so.ge(f, date.fromisoformat(s)),
        'default': lambda f, s: so.eq(f, s if s != 'null' else None),
    },
}


def get_operator(
    field: t.Any, field_type: type, value: t.Any, operator: t.Optional[str] = None
) -> t.Any:
    cls_name: str = field_type.__name__.lower()
    if operator is None:
        if cls_name not in OPERATOR_TO_TYPE:
            return so.eq(field, value)
        operator = 'default'
    if str.lower(cls_name) not in OPERATOR_TO_TYPE:
        raise ValueError(f'unknown class name {cls_name}')
    try:
        op_cls = OPERATOR_TO_TYPE[cls_name][operator]
    except KeyError as err:
        raise ValueError(f'invalid operator {operator} for {field}') from err
    return op_cls(field, value)


def parse_word(
    part: pp.ParseResults,
    model: t.Type,
    available_fields: t.Optional[t.List[str]] = None,
) -> t.Any:
    # pylint: disable=too-many-branches
    field_parts: t.List[str] = [''.join(part[0])]
    value = None
    operator = None
    for p in part[1:]:
        if p.get_name() == 'field_name':
            field_parts += [''.join(p)]
        if p.get_name() == 'operator':
            operator = ''.join(p)
        if p.get_name() == 'value':
            if len(p) > 1:
                value = p
            else:
                value = ''.join(p)
    field_name = '.'.join(field_parts)
    field_name_dash = '__'.join(field_parts)
    if (
        available_fields
        and field_name not in available_fields
        and field_name_dash not in available_fields
    ):
        raise PermissionError(f'you can not search by field {field_name}')
    try:
        field = getattr(model, field_parts[0])
    except KeyError as err:
        raise PermissionError(
            f'you can not search by this field "{field_name}"'
        ) from err
    if isinstance(field, ColumnAssociationProxyInstance):
        if value is None or value == 'null':
            return ~field.any()
        return field.in_([value])
    if field.key in model.__mapper__.relationships:
        if value is None or value == 'null':
            return ~field.property.class_attribute.any()
        return field.property.class_attribute.any(
            get_operator(field.property.mapper.class_.id, int, value, operator)
        )
    if field.type.python_type is dict:
        return get_operator(
            func.jsonb_extract_path_text(
                field,
                *field_parts[1:],
            ),
            str,
            value,
            operator,
        )
    return get_operator(field, field.type.python_type, value, operator)


def parsed_to_query(
    parsed: pp.ParseResults,
    model: t.Type,
    available_fields: t.Optional[t.List[str]] = None,
) -> t.Optional[t.Mapping[str, t.Any]]:
    query = None
    operator = None
    for part in reversed(parsed):
        if isinstance(part, pp.ParseResults):
            if part.get_name() == 'parenthesis':
                part = parsed_to_query(part, model, available_fields)
            else:
                part = parse_word(part, model, available_fields)
        if query is None:
            query = part
            continue
        if isinstance(part, str):
            operator = OPERATORS[str.upper(part)]
            continue
        if operator is None:
            operator = DEFAULT_OPERATOR
        query = operator(part, query)
        operator = None
    return query


def filter_to_query(
    query: str, model: t.Type, available_fields: t.Optional[t.List[str]] = None
) -> t.Optional[t.Mapping[str, t.Any]]:
    parsed = SEARCH_PARSE_STRING(query, False)
    return parsed_to_query(parsed, model, available_fields)


def sort_to_query(
    model: t.Type,
    sort_by: str,
    direction: str = 'asc',
    available_sort_fields: t.Optional[t.List[str]] = None,
) -> t.Tuple[t.Any]:
    def add_direction(value: str) -> t.Any:
        if value and value[0] in ['+', '-']:
            return value
        if direction == 'desc':
            return f'-{value}'
        return f'+{value}'

    def filter_field(field: str) -> bool:
        if not field:
            return False
        field_name = field.lstrip('+').strip()
        if available_sort_fields:
            return field_name in available_sort_fields
        return True

    def get_model_field(model_: t.Any, field: str) -> t.Any:
        parts = field.split('__')
        main_field = getattr(model_, parts[0])
        if len(parts) == 1:
            return main_field
        return func.jsonb_extract_path_text(main_field, *parts[1:])

    def convert_to_sa(value: str) -> t.Any:
        if value[0] == '-':
            return get_model_field(model, value[1:]).desc()
        return get_model_field(model, value[1:])

    if ',' in sort_by:
        return tuple(
            map(
                convert_to_sa,
                map(add_direction, filter(filter_field, sort_by.split(','))),
            )
        )  # type: ignore
    return (convert_to_sa(add_direction(sort_by)),)
