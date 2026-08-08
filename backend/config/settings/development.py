from .base import *  # noqa: F401,F403
from decouple import config

DEBUG = True

import sys

if "test" in sys.argv:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": config("DB_NAME", default="karyakram_db"),
            "USER": config("DB_USER", default="karyakram_user"),
            "PASSWORD": config("DB_PASSWORD", default="karyakram"),
            "HOST": config("DB_HOST", default="localhost"),
            "PORT": config("DB_PORT", default="5432"),
        }
    }

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Allows running Celery tasks synchronously in local dev if configured via env
CELERY_TASK_ALWAYS_EAGER = config("CELERY_TASK_ALWAYS_EAGER", cast=bool, default=False)

# Relax DRF burst throttling in development mode (100 requests/min)
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]["auth_burst"] = config("THROTTLE_AUTH_BURST", default="100/min")


