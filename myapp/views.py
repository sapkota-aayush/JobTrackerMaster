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
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from django.shortcuts import get_object_or_404
from .throttling import ProgressiveThrottle
from django.core.cache import cache
import time

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
    throttle = ProgressiveThrottle()

    if user is None:
        if not throttle.allow_request(request, view=None):
            wait_seconds = throttle.get_wait_time(request)
            minutes, seconds = divmod(wait_seconds, 60)
            wait_msg = f"Try again in {minutes} minute(s) and {seconds} second(s)."
            return Response({'error': f'Too many failed attempts. {wait_msg}'}, status=429)
        raise AuthenticationFailed('Invalid credentials')

    # On successful login, reset the throttle counter
    throttle.reset(request)

    # Assuming you have UserProfile and UserProfileSerializer
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


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        tokens = OutstandingToken.objects.filter(user_id=request.user.id)
        for token in tokens:
            _, _ = BlacklistedToken.objects.get_or_create(token=token)

        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)

class BoardView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user

        # Get the user's profile (make sure UserProfile is created automatically on signup)
        user_profile = user.profile  # Or query manually if not using signals

        serializer = JobSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(user=user_profile)  # attach user
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JobUpdateView(APIView):
    permission_classes=[IsAuthenticated]
    
    def post(self,request,pk,*args,**kwargs):
        job=get_object_or_404(JobModel,pk=pk,user=request.user.profile)
        serializer=JobSerializer(job,data=request.data,partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data,status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUESET)

class DeleteView(APIView):
    permission_class=[IsAuthenticated]
    
    def post(self,request,pk,*args,**kwargs):
        job=get_object_or_404(JobModel,pk=pk,user=request.user.profile)
        job.status='REMOVED'
        job.save()
        return Response({'message':'Job removed from the wishlist.'})