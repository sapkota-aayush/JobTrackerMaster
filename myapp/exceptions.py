# File for handling exceptions in the application (Custom exceptions)
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.http import Http404
from rest_framework.exceptions import NotFound

def custom_exception_handler(exc, context):
    # Calling the REST framework's default exception handler first
    response = exception_handler(exc, context)

    if isinstance(exc, (Http404, NotFound)):
        return Response({
            "status": "error",
            "code": 404,
            "message": "😕 Oops! The resource you’re looking for doesn't exist.",
            "image": "https://sl.bing.net/k47D5ION724"
        }, status=status.HTTP_404_NOT_FOUND)

    # For other errors, keep the default handler's response, possibly customize
    if response is not None:
        response.data['status'] = 'error'
        response.data['code'] = response.status_code
        response.data['message'] = response.data.get('detail', 'An error occurred.')
        response.data.pop('detail', None)
        return response

    # Fallback for unhandled exceptions (500)
    return Response({
        "status": "error",
        "code": 500,
        "message": "💥 Server Error! Something went wrong on our side. Please try again later."
        
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
