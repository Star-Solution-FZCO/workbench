def humanize_day_type(day_type: str) -> str:
    return ' '.join(day_type.split('_')).capitalize()
