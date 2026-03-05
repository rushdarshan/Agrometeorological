"""
Celery worker entrypoint.
Start with: celery -A celery_worker worker --loglevel=info -Q sms,advisories
"""

from app.tasks import celery_app

if __name__ == "__main__":
    celery_app.start()
