import traceback
import sys

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if isinstance(exc, (Http404, NotFound)):
        return Response({
            "status": "error",
            "code": 404,
            "message": "😕 Oops! The resource you’re looking for doesn't exist.",
            "image": "https://sl.bing.net/k47D5ION724"
        }, status=status.HTTP_404_NOT_FOUND)

    if response is not None:
        response.data['status'] = 'error'
        response.data['code'] = response.status_code
        response.data['message'] = response.data.get('detail', 'An error occurred.')
        response.data.pop('detail', None)
        return response

    # For unhandled exceptions: log full traceback for debugging
    print("Unhandled exception:", file=sys.stderr)
    traceback.print_exc()

    # You can expose the error message in dev but not in production
    return Response({
        "status": "error",
        "code": 500,
        "message": str(exc),  # or "💥 Server Error! ..." in prod
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
