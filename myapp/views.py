from django.shortcuts import render
from .models import UserProfile, JobModel

# Create your views here.
def home(request):
    return render(request, "myapp/home.html")
