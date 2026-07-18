from .base import *
from decouple import config

DEBUG = True
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "karyakram_db",
        "USER": "karyakram_user",
        "PASSWORD": "karyakram",
        "HOST": "localhost",
        "PORT": "5432",
    }
}

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Media Files Configuration
from pathlib import Path
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
