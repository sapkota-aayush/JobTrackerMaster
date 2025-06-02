from django.shortcuts import render, get_object_or_404
from django.contrib.auth import authenticate, get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import AuthenticationFailed
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from rest_framework.views import APIView
from rest_framework import status
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from .models import UserProfile, JobModel
from .serializers import UserProfileSerializer, JobSerializer
from django.contrib.auth.decorators import login_required
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.shortcuts import redirect



# HTML page view
def home(request):
    return render(request, "myapp/home.html")

@csrf_exempt
def login_page(request):
    return render(request, "myapp/login.html")

def dashboard_view(request):
    jwt_authenticator = JWTAuthentication()
    
    # Read token from cookie
    token = request.COOKIES.get('access_token')
    if not token:
        return redirect('login_page')

    try:
        validated_token = jwt_authenticator.get_validated_token(token)
        user = jwt_authenticator.get_user(validated_token)
    except AuthenticationFailed:
        return redirect('login_page')

    context = {"user": user}
    return render(request, "myapp/dashboard.html", context)



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

    # Get user profile
    try:
        user_profile = UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        raise AuthenticationFailed('User profile not found')

    serialized_user = UserProfileSerializer(user_profile).data
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite='None',
        path='/'
    )

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
            refresh_token = request.COOKIES.get('refresh_token')  # Secure server-side access

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

        except Exception:
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

        # Get the user's profile (adjust if your relation is different)
        user_profile = user.profile if hasattr(user, 'profile') else UserProfile.objects.get(user=user)

        serializer = JobSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(user=user_profile)  # attach user profile
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JobUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        job = get_object_or_404(JobModel, pk=pk, user=request.user.profile)
        serializer = JobSerializer(job, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        job = get_object_or_404(JobModel, pk=pk, user=request.user.profile)
        job.status = 'REMOVED'
        job.save()
        return Response({'message': 'Job removed from the wishlist.'})
