import base64
import hashlib

from aioauth.config import Settings
from aioauth.oidc.core.grant_type import AuthorizationCodeGrantType
from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.serialization import Encoding

from wb.config import CONFIG

__all__ = (
    'settings',
    'JWK_PRIVATE_KEY',
    'GRANT_TYPES',
    'JWS_DATA',
)


settings = Settings(
    TOKEN_EXPIRES_IN=CONFIG.ACCESS_TOKEN_EXPIRES,
    REFRESH_TOKEN_EXPIRES_IN=CONFIG.REFRESH_TOKEN_REMEMBER_EXPIRES,
    INSECURE_TRANSPORT=CONFIG.DEV_MODE,
)


def _read_file_bytes(file_path: str) -> bytes:
    with open(file_path, 'rb') as key_file:
        return key_file.read()


def _read_rsa_cert(cert: x509.Certificate) -> str:
    return base64.b64encode(cert.public_bytes(encoding=Encoding.DER)).decode('utf-8')


def _gen_fingerprint(cert: x509.Certificate) -> str:
    return hashlib.sha1(cert.tbs_certificate_bytes, usedforsecurity=False).hexdigest()


def _int_to_base64url(num: int) -> str:
    byte_representation = num.to_bytes((num.bit_length() + 7) // 8, byteorder='big')
    return base64.urlsafe_b64encode(byte_representation).rstrip(b'=').decode('utf-8')


JWK_PRIVATE_KEY: bytes = _read_file_bytes(CONFIG.OAUTH_JWK_PRIVATE_KEY)

_cert = x509.load_pem_x509_certificate(
    _read_file_bytes(CONFIG.OAUTH_JWK_PUBLIC_CERT), default_backend()
)
JWS_DATA = {
    'x5c': base64.b64encode(_cert.public_bytes(Encoding.DER)).decode('utf-8'),
    'x5t': hashlib.sha1(_cert.tbs_certificate_bytes, usedforsecurity=False).hexdigest(),
    'e': _int_to_base64url(_cert.public_key().public_numbers().e),
    'n': _int_to_base64url(_cert.public_key().public_numbers().n),
}

GRANT_TYPES = {
    'authorization_code': AuthorizationCodeGrantType,
}
