# serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, JobModel

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = UserProfile
        fields = ['id', 'user']

class JobSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer()

    class Meta:
        model = JobModel
        fields = '__all__'
