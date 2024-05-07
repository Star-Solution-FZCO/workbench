from typing import Dict


def transform_youtrack_project_field(obj: Dict) -> Dict:
    field = obj.get('field', {})
    name = field.get('name', '')
    default_values = field.get('fieldDefaults', {}).get('defaultValues', [])
    value = ''
    if len(default_values) > 0:
        value = default_values[0].get('name', '')
    return {'name': name, 'value': value}
