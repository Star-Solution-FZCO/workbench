#!/bin/sh
python3 -m isort wb shared_utils
python3 -m ruff format --no-cache wb shared_utils

cd frontend
npx prettier . --write -l
cd ..
