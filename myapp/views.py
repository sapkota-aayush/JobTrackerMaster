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
from .models import UserProfile, JobModel,ContactMessage
from .serializers import UserProfileSerializer, JobSerializer, ContactSerializer
from django.contrib.auth.decorators import login_required
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.shortcuts import redirect
import requests
from django.conf import settings
from django.contrib.auth.models import User
from django.http import JsonResponse
from .utils import send_contact_email_task
from openai import OpenAI
from .openai_client import client



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

    # Get the full user object with profile
    try:
        user_profile = UserProfile.objects.get(user=user)
    except UserProfile.DoesNotExist:
        # Handle case where profile doesn't exist
        user_profile = None

    # Create context with user details
    context = {
        "user": {
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
        }
    }
    
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

    def post(self, request, *args, **kwargs):
        try:
            job_id = request.data.get('id')
            if not job_id:
                return Response(
                    {"error": "Job ID is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            job = get_object_or_404(JobModel, id=job_id, user=request.user.profile)
            serializer = JobSerializer(job, data=request.data, partial=True)

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        job = get_object_or_404(JobModel, pk=pk, user=request.user.profile)
        job.status = 'REMOVED'
        job.save()
        return Response({
            "success":true,
            "message":"Job removed from the wishlist."
        })


#Note dont user validation id user has no job fiels. There will be problem fetching from frontend 
class GetView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user_profile = request.user.profile
            jobs = user_profile.jobs.all()
            if not jobs.exists():
                return Response([], status=status.HTTP_200_OK)
            serializer = JobSerializer(jobs, many=True)
            return Response(serializer.data)
        except AttributeError:
            return Response([], status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
 

class JobDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        try:
            job = get_object_or_404(JobModel, id=pk, user=request.user.profile)
            serializer = JobSerializer(job)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# OAuth Implementation

def google_login_redirect(request):
    google_auth_url=(
        "https://accounts.google.com/o/oauth2/v2/auth"
        "?response_type=code"
        f"&client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
        "&scope=openid email profile"
    )
    return redirect(google_auth_url)

def google_callback(request):
    code=request.GET.get('code')
    
    if not code:
        return JsonResponse({'error':'No authorization code provided '},status=400)
    
    token_data={
        'code':code,
        'client_id':settings.GOOGLE_CLIENT_ID,
        'client_secret':settings.GOOGLE_CLIENT_SECRET,
        'redirect_uri':settings.GOOGLE_REDIRECT_URI,
        'grant_type':'authorization_code'
    }
    
    token_response=requests.post('https://oauth2.googleapis.com/token',data=token_data)
    token_json=token_response.json()
    access_token=token_json.get('access_token')
    
    if not access_token:
        return JsonResponse({'error':'Failed to obtain the access token'},status=400)
    
    
    userinfo_response=requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization":f"Bearer{access_token}"}
    )
    
    userinfo=userinfo_response.json()
    email=userinfo.get('email')
    name=userinfo.get('name')
    
    if not email:
        return JsonResponse({'error':"Failed to retrieve user info."},status=400)
    
    try:
        user = User.objects.get(email=email)
        created = False
    except User.DoesNotExist:
        user=User.objects.create_user(username=email,email=email)
        user.first_name=name
        user.save()
        
        #Creating userprofile linked to user for one to one
        UserProfile.objects.create(user=user)
        created=True
        
    #Time to generate JWT tokens
    refresh=RefreshToken.for_user(user)
    access_token=str(refresh.access_token)
    refresh_token=str(refresh)
    
    return JsonResponse({
        'access_token':access_token,
        'refresh_token':refresh_token,
        'message':'User created' if created else 'User logged in'
    })
    




class ContactMessageView(APIView):
    permission_classes = [AllowAny] 
    def post(self,request):
        serializer=ContactSerializer(data=request.data)
        if serializer.is_valid():
         
            
     #Abstraction form utils.py
            send_contact_email_task.delay(
                name=serializer.validated_data['name'],
                email=serializer.validated_data['email'],
                message=serializer.validated_data['message']
            )
            
            serializer.save()
            
            return Response({"detail":"Message sent sucessfully."},status=status.HTTP_201_CREATED)
        
        
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
    
class AIAssistantView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        question = request.data.get("message")
        if not question:
            return Response({"error": "No question provided."}, status=400)

        try:
            user_profile = request.user.profile
            jobs = user_profile.jobs.all()

            if not jobs.exists():
                return Response({"reply": "You have no jobs in your tracker."})

            # Convert jobs to a simple list of dictionaries for the AI to understand
            job_list = [
                {
                    "title": job.title,
                    "company": job.company,
                    "status": job.status,
                    "applied_on": job.applied_on.strftime('%Y-%m-%d'),
                    "location": job.location,
                    "salary": str(job.salary) if job.salary else "N/A"
                }
                for job in jobs
            ]

            # Create a prompt for OpenAI
            system_message = (
                "You are an assistant that helps users track and analyze their job applications. "
                "Use the data provided to answer questions like how many jobs they’ve applied to, "
                "how many were rejected, and so on."
            )

            user_prompt = f"""User has submitted the following jobs:
{job_list}

User asks: "{question}"
Answer in a helpful and friendly way.
"""

            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_prompt}
                ]
            )

            reply = response.choices[0].message.content
            return Response({"reply": reply})

        except Exception as e:
            return Response({"error": str(e)}, status=500)

