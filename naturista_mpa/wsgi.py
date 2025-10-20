"""
WSGI config for naturista_mpa project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'naturista_mpa.settings')

application = get_wsgi_application()
