"""
Production settings — extends base settings.py
"""
from .settings import *
import os

DEBUG = False

ALLOWED_HOSTS = ['72.62.21.162', 'srv1404625.hstgr.cloud', 'localhost', '127.0.0.1']

# Whitenoise for serving static files
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Serve frontend build
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Security
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_TYPE_NOSNIFF = True

# CORS
CORS_ALLOWED_ORIGINS = [
    'http://72.62.21.162',
    'http://srv1404625.hstgr.cloud',
]
