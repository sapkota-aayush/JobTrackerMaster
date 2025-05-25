from django.shortcuts import render
from .models import UserProfile, JobModel
from .serializers import UserProfileSerializer, JobSerializer
from django.config import settings
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from rest_framework import RefeshToken
from rest_framwork.permissions import IsAuthenticated, AllowAny
from rest_framework.reponse import Response
from rest_framework.decorators import api_view, permission_classes


# Create your views here.
def home(request):
    return render(request, "myapp/home.html")

