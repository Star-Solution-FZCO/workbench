#!/bin/sh
if [ "$1" = "celery-worker" ] ; then
  echo "Starting celery worker"
  export DISABLE_AUDIT=True
  export MULTITHREADING_ENABLED=True
  exec celery --app=wb.celery_app.celery_app worker
elif [ "$1" = "celery-beat" ]; then
  echo "Starting celery beat"
  export DISABLE_AUDIT=True
  export MULTITHREADING_ENABLED=True
  exec celery --app=wb.celery_app.celery_app beat -s /tmp/celerybeat-schedule
else
  echo "Starting fastapi app"
  PRE_START_PATH=${PRE_START_PATH:-/app/prestart.sh}
  echo "Checking for script in $PRE_START_PATH"
  if [ -f $PRE_START_PATH ] ; then
      echo "Running script $PRE_START_PATH"
      . "$PRE_START_PATH"
  else
      echo "There is no script $PRE_START_PATH"
  fi

  export APP_MODULE=${APP_MODULE:-wb.app:app}
  export HOST=${HOST:-0.0.0.0}
  export PORT=${PORT:-9090}
  export BACKEND_CORS_ORIGINS=${BACKEND_CORS_ORIGINS}

  # if WEB_CONCURRENCY is set then we should use prometheus multiprocess mode
  if [ "$WEB_CONCURRENCY" ]; then
    echo "WEB_CONCURRENCY is set to $WEB_CONCURRENCY, enabling prometheus multiprocess mode"
    export PROMETHEUS_MULTIPROC_DIR=/tmp/prom_multiproc
    if [ -d "$PROMETHEUS_MULTIPROC_DIR" ]; then rm -Rf "$PROMETHEUS_MULTIPROC_DIR"; fi
    mkdir -p "$PROMETHEUS_MULTIPROC_DIR"
  fi

  # run gunicorn
  exec gunicorn --bind $HOST:$PORT "$APP_MODULE" -k uvicorn.workers.UvicornWorker
fi
