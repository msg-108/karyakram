from .base import *
from decouple import config, Csv

DEBUG = False

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

ALLOWED_HOSTS = config('ALLOWED_HOSTS', cast=Csv())

SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'