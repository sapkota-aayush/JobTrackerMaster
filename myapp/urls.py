from django.contrib import admin
from django.urls import path, include  
from .views import (
    home, 
    login_page, 
    CustomRefreshTokenView,
    LogoutView,
    BoardView,
    JobUpdateView,
    DeleteView,
    login_view,
    dashboard_view,
    GetView,
    JobDetailView,
    google_login_redirect,
    google_callback
)
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', home, name='home'),
    path('login/', login_page, name='login_page'),
    path('api/login/', login_view, name='login_view'),  # Removed .as_view() because login_view is a function
    path('dashboard/', dashboard_view, name='dashboard'),    
    path('api/token/refresh/', CustomRefreshTokenView.as_view(), name='token_refresh'),
    path('api/logout/', LogoutView.as_view(), name='auth_logout'),
    path('api/board/', BoardView.as_view(), name='Whislist'),
    path('api/update/', JobUpdateView.as_view(), name='Update'),
    path('api/delete/<int:pk>/', DeleteView.as_view(), name='delete'),
    path('api/get/', GetView.as_view(), name='get'),
    path('api/get/<int:pk>/', JobDetailView.as_view(), name='job-detail'),
    
    #OAuth endpoints
    path('auth/google/login/',google_login_redirect,name='google_login'),
    path('api/oauth/callback/',google_callback, name='google_callback')
     
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
