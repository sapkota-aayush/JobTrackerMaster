from django.contrib import admin
from .models import UserProfile, JobModel

# Register your models here.
admin.site.register(UserProfile)
admin.site.register(JobModel)
