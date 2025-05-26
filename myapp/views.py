from django.shortcuts import render
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework import exceptions
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import UserProfile, JobModel
from .serializers import UserProfileSerializer, JobSerializer
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, get_user_model
from rest_framework.exceptions import AuthenticationFailed
from django.http import HttpResponse
from rest_framework import status 

# HTML page view
def home(request):
    return render(request, "myapp/home.html")

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def login_view(request):
    User = get_user_model()
    username = request.data.get('username')
    password = request.data.get('password')
    response = Response()

    if not username or not password:
        raise AuthenticationFailed('Please provide username and password')

    user = authenticate(request, username=username, password=password)

    if user is None:
        raise AuthenticationFailed('Invalid credentials')


    try:
        user_profile = UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        raise AuthenticationFailed('User profile not found')

    serialized_user = UserProfileSerializer(user_profile).data
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    response.set_cookie(key='refresh_token', value=refresh_token, httponly=True)
    response.data = {
        "status": "success",
        'access_token': access_token,
        'user': serialized_user,
    }
    return response


# Custom refresh token view to handle HttpOnly cookies
class CustomRefreshTokenView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.COOKIES.get('refresh_token')  # 👈 Secure server-side access

            if not refresh_token:
                return Response({'error': 'No refresh token'}, status=400)

            # Inject refresh token into request data
            request.data['refresh'] = refresh_token

            # Call built-in refresh logic
            response = super().post(request, *args, **kwargs)

            # Optionally reset refresh token in cookie again
            response.set_cookie(
                key='refresh_token',
                value=refresh_token,
                httponly=True,
                secure=True,
                samesite='None',
                path='/'
            )

            return response

        except Exception as e:
            return Response({'error': 'Token refresh failed'}, status=401)
