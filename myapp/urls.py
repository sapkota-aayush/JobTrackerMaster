from django.contrib import admin
from django.urls import path,include
from .views import home
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
path('',home,name='home'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
