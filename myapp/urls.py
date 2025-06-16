from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

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
    google_callback,
    ContactMessageView,
    AIAssistantView
)

schema_view = get_schema_view(
    openapi.Info(
        title="Job Tracker API",
        default_version='v1',
        description="API documentation for your Django Job Tracker project",
        terms_of_service="https://www.example.com/terms/",
        contact=openapi.Contact(email="developer@example.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
    # This tells Swagger UI to use the Bearer auth defined in settings
)

urlpatterns = [
    path('admin/', admin.site.urls),

    path('', home, name='home'),
    path('login/', login_page, name='login_page'),
    path('api/login/', login_view, name='login_view'),
    path('dashboard/', dashboard_view, name='dashboard'),
    path('api/token/refresh/', CustomRefreshTokenView.as_view(), name='token_refresh'),
    path('api/logout/', LogoutView.as_view(), name='auth_logout'),
    path('api/board/', BoardView.as_view(), name='Whislist'),
    path('api/update/', JobUpdateView.as_view(), name='Update'),
    path('api/delete/<int:pk>/', DeleteView.as_view(), name='delete'),
    path('api/get/', GetView.as_view(), name='get'),
    path('api/get/<int:pk>/', JobDetailView.as_view(), name='job-detail'),
    path('api/contact/', ContactMessageView.as_view(), name='contact'),
    path('auth/google/login/', google_login_redirect, name='google_login'),
    path('api/oauth/callback/', google_callback, name='google_callback'),
    path('api/ai-assistant/', AIAssistantView.as_view(), name='ai-assistant'),

    # Swagger URLs
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('swagger.yaml', schema_view.without_ui(cache_timeout=0), name='schema-yaml'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
