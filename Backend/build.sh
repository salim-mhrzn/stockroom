#!/usr/bin/env bash
# Build script run by Render (or any platform that supports a build command)
# before starting the app. Installs deps, gathers static files for whitenoise,
# and applies migrations so the deployed DB schema is always up to date.
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
