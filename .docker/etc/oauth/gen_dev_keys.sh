#!/bin/bash
openssl genrsa -out jwk.key 2048
openssl req -new -x509 -key jwk.key -out jwk.crt -days 3650  -subj "/C=UK/ST=DEV/L=DEV/O=DEV/OU=DEV/CN=DEV"
chmod +r jwk.key
