from django.contrib import admin
from django.urls import path, include  
from .views import home, login_view, CustomRefreshTokenView,LogoutView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', home, name='home'),
    path('api/login/', login_view),
    path('api/token/refresh/', CustomRefreshTokenView.as_view(), name='token_refresh'),
    path('api/logout/', LogoutView.as_view(), name='auth_logout'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
