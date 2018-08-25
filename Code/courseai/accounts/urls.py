from . import views
from django.urls import path

urlpatterns = [
    path('login_view', views.login_view),     # http://127.0.0.1:8000/accounts/login_view
    path('register_view', views.register_view),
    path('logout_view', views.logout_view)
]