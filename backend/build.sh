#!/usr/bin/env bash
# Exit on error
set -o errexit

cd backend
pip install -r requirements/production.txt
python manage.py collectstatic --no-input
python manage.py migrate
