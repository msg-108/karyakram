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

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]

# Media Files Configuration
from pathlib import Path
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
