from wb.config import CONFIG

__all__ = ('check_email_domain',)


def check_email_domain(email: str) -> bool:
    """
    Check if the domain of the given email is in the whitelist.

    :param email: A string representing an email address.
    :type email: str
    :return: True if the domain is in the whitelist, False otherwise.
    :rtype: bool
    :raises ValueError: If the email is not in the correct format.

    :Example:
    >>> check_email_domain('example@example.com')
    True
    >>> check_email_domain('test@test.org')
    False
    >>> check_email_domain('invalid_email')
    ValueError: invalid_email is not an email
    """
    parts = email.split('@')
    if len(parts) != 2:
        raise ValueError(f'{email} is not an email')
    return parts[1] in CONFIG.EMAIL_DOMAIN_WHITELIST
