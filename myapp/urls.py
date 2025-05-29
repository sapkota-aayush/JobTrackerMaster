from django.contrib import admin
from django.urls import path, include  
from .views import home, login_view, CustomRefreshTokenView,LogoutView,BoardView,JobUpdateView,DeleteView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', home, name='home'),
    path('api/login/', login_view),
    path('api/token/refresh/', CustomRefreshTokenView.as_view(), name='token_refresh'),
    path('api/logout/', LogoutView.as_view(), name='auth_logout'),
    path('api/board/',BoardView.as_view(),name='Whislist'),
    path('api/update/<int:pk>/',JobUpdateView.as_view(),name='Update'),
    path('api/delete/<int:pk>/',DeleteView.as_view(),name='delete')
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
