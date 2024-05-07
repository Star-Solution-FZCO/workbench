#!/bin/sh
python3 -m ruff format --no-cache --check wb timetracking shared_utils || exit 1;
python3 -m mypy timetracking shared_utils || exit 1;
if [ -z ${PYLINT_CPU_COUNT} ]; then
  PYLINT_CPU_COUNT=2
fi
XDG_CACHE_HOME=/tmp/pylint python3 -m pylint -j ${PYLINT_CPU_COUNT} wb timetracking shared_utils || exit 1;
python3 migrations/verify_versions.py || exit 1;
