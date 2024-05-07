FROM python:3.11-slim-bookworm as common

ENV APP_DIR /app
ENV APP_NAME wb
ENV PYTHONPATH=${APP_DIR}

# If you need to install additional trusted CA certificates, copy them to the contrib/certs directory before building the image
COPY contrib/certs/*.crt /usr/local/share/ca-certificates/
RUN update-ca-certificates
RUN apt-get update &&\
    apt-get install -y git gcc libldap2-dev libsasl2-dev &&\
    mkdir -p "${APP_DIR}/etc" &&\
    mkdir -p "${APP_DIR}/var" &&\
    rm -rf "/var/lib/apt/lists/*"

WORKDIR ${APP_DIR}

RUN ln -s etc/settings.toml settings.toml &&\
    groupadd -r -g 999 ${APP_NAME} &&\
    useradd -u 999 -g 999 -d ${APP_DIR} -r -c "${APP_NAME} USER" ${APP_NAME}


FROM common as test

COPY Pipfile ${APP_DIR}/
COPY Pipfile.lock ${APP_DIR}/
RUN python3 -m pip install --no-cache-dir --upgrade pip pipenv gunicorn uvicorn &&\
    python3 -m pipenv install --dev --deploy --system


COPY contrib/fonts/* /usr/share/fonts/truetype/
COPY . ${APP_DIR}/

COPY lint.sh /lint.sh
RUN chmod +x /lint.sh

USER ${APP_NAME}
ENV PYTHONPATH "${PYTHONPATH}:${APP_DIR}/thirdparty"
ENV APP_VERSION "__TEST__"
ENTRYPOINT ["/lint.sh"]


FROM common as prod

COPY Pipfile ${APP_DIR}/
COPY Pipfile.lock ${APP_DIR}/
RUN python3 -m pip install --no-cache-dir --upgrade pip pipenv gunicorn uvicorn &&\
    python3 -m pipenv install --deploy --system


COPY contrib/fonts/* /usr/share/fonts/truetype/
COPY . ${APP_DIR}/

COPY contrib/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER ${APP_NAME}
VOLUME ["${APP_DIR}/var", "${APP_DIR}/etc"]
ENV PYTHONPATH "${PYTHONPATH}:${APP_DIR}/thirdparty"
ARG version="__DEV__"
ENV APP_VERSION $version
ENTRYPOINT ["/entrypoint.sh"]
