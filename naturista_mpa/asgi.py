"""
ASGI config for naturista_mpa project.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'naturista_mpa.settings')

application = get_asgi_application()
