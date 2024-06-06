from wb.config import CONFIG

__all__ = ('validate_password_strength',)

SPECIFIC_CHARACTERS = frozenset(' !"#$%&\'()*+,-./:;<=>?@[\]^_`{|}~')
KEYBOARD_LINES = (
    '1234567890',
    # English
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm',
    # French
    'azertyuiop',
    'qsdfghjklm',
    'wxcvbn',
    # German
    'qwertzuiopü',
    'asdfghjklöä',
    'yxcvbnm',
    # Spanish
    'asdfghjklñ',
    # Italian
    'asdfghjklè',
    # Polish
    'asdfghjklł',
    # Turkish
    'qwertyuiopğü',
    'asdfghjklşi',
    # Swedish
    'qwertyuiopå',
    'asdfghjklöä',
    # Portuguese
    'asdfghjklç',
    # Hungarian
    'qwertzuiopőú',
    'asdfghjkléáű',
    'íyxcvbnm',
    # Russian
    'йцукенгшщзхъ',
    'фывапролджэ',
    'ячсмитьбю',
    # Ukrainian
    'йцукенгшщзхї',
    'фівапролджє',
    # Belarusian
    'йцукенгшўзх',
    # Kazakh
    'қйуөүіоп',
    'асдфгһжқл',
    'әэрыцнмб',
    # Armenian
    'չղճռպյծձհկ',
    'ասդֆգհյկլ',
    'զքըշւգբնմ',
    # Korean (2-set)
    'ㅂㅈㄷㄱㅅㅛㅕㅑㅐㅔ',
    'ㅁㄴㅇㄹㅎㅗㅓㅏㅣ',
    'ㅋㅌㅊㅍㅠㅜㅡ',
    # Arabic
    'ضصثقفغعهخحجد',
    'شسيبلاتنمكط',
    'ئءؤرلاىةوزظ',
    # Georgian
    'ყერტყუიოპ',
    'ასდფგჰჯკლ',
    'ზხცვბნმ',
    # Hindi
    'ौरतयुिोप',
    'ासदफगहजकल',
    'श्वचसमितबनम',
)
PASSWORD_PART_LEN = 4


def validate_password_strength(password: str) -> list[str]:
    """
    Validate password strength according to the following rules:
    - Password must be at least CONFIG.PASSWORD_MIN_LENGTH characters long
    - Password must contain at least one digit
    - Password must contain at least one uppercase letter
    - Password must contain at least one lowercase letter
    - Password must contain at least one special character
    - Password must not contain 4 consecutive characters from the same keyboard line
    - Password must not contain 4 consecutive identical characters
    - Password must not contain 4 consecutive characters which are consecutive in the UTF-8 encoding

    :param password: Password to validate
    :type password: str
    :return: List of errors if any
    :rtype: list[str]
    """
    errors = []
    if len(password) < CONFIG.PASSWORD_MIN_LENGTH:
        errors.append(
            f'Password must be at least {CONFIG.PASSWORD_MIN_LENGTH} characters long'
        )
    if not any(char.isdigit() for char in password):
        errors.append('Password must contain at least one digit')
    if not any(char.isupper() for char in password):
        errors.append('Password must contain at least one uppercase letter')
    if not any(char.islower() for char in password):
        errors.append('Password must contain at least one lowercase letter')
    if not any(char in SPECIFIC_CHARACTERS for char in password):
        errors.append('Password must contain at least one special character')
    has_keyboard_lines = False
    has_same = False
    has_consecutive = False
    for idx in range(len(password) - PASSWORD_PART_LEN + 1):
        part = password[idx : idx + PASSWORD_PART_LEN]
        has_keyboard_lines = has_keyboard_lines or any(
            part.lower() in qline for qline in KEYBOARD_LINES
        )
        has_same = has_same or len(set(part)) == 1
        has_consecutive = has_consecutive or all(
            abs(ord(part[i]) - ord(part[i + 1])) == 1
            for i in range(PASSWORD_PART_LEN - 1)
        )
    if has_keyboard_lines:
        errors.append(
            f'Password must not contain {PASSWORD_PART_LEN} consecutive characters from the same keyboard line'
        )
    if has_same:
        errors.append(
            f'Password must not contain {PASSWORD_PART_LEN} consecutive identical characters'
        )
    if has_consecutive:
        errors.append(
            f'Password must not contain {PASSWORD_PART_LEN} consecutive characters '
            f'which are consecutive in the UTF-8 encoding'
        )
    return errors
