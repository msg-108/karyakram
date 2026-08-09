from .base import *  # noqa: F401,F403
from decouple import config, Csv

DEBUG = False

ALLOWED_HOSTS_RAW = config("ALLOWED_HOSTS", default="")
if not ALLOWED_HOSTS_RAW:
    raise ValueError("ALLOWED_HOSTS is not set in environment for production")

ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_RAW.split(",") if host.strip()]

database_url = config("DATABASE_URL", default="")
if database_url:
    import dj_database_url
    DATABASES = {
        "default": dj_database_url.config(
            default=database_url,
            conn_max_age=config("DB_CONN_MAX_AGE", cast=int, default=60),
            ssl_require=config("DB_SSL_REQUIRE", cast=bool, default=False),
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": config("DB_NAME"),
            "USER": config("DB_USER"),
            "PASSWORD": config("DB_PASSWORD"),
            "HOST": config("DB_HOST"),
            "PORT": config("DB_PORT", default="5432"),
            "CONN_MAX_AGE": config("DB_CONN_MAX_AGE", cast=int, default=60),
        }
    }

# Security hardening
SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", cast=bool, default=True)
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = "DENY"
