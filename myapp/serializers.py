# serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, JobModel, ContactMessage

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class UserProfileSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='user.id')
    username = serializers.CharField(source='user.username')
    email = serializers.EmailField(source='user.email')

    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email']

class JobSerializer(serializers.ModelSerializer):
    user = UserProfileSerializer(read_only=True)

    class Meta:
        model = JobModel
        fields = '__all__'
        
class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model=ContactMessage
        fields = ['id', 'name', 'email', 'message', 'created_at']
        read_only_fields=['id','created_at']
    
