import logging

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Wraps DRF's default exception handler so that:
    - Known API errors (validation, permission, not-found, etc.) keep DRF's
      normal response shape -- no change in behavior there.
    - Unexpected/unhandled exceptions (bugs, DB errors) are logged server-side
      and returned as a generic, safe JSON error instead of a raw traceback
      (which DRF/Django would otherwise expose when DEBUG=False -- a 500 HTML
      page in production, or a leaking stack trace in DEBUG mode).
    """
    response = exception_handler(exc, context)

    if response is not None:
        return response

    logger.exception("Unhandled exception in %s", context.get("view"))

    return Response(
        {"detail": "Something went wrong on our end. Please try again."},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
