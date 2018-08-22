from . import views
from django.urls import path

urlpatterns = [
    path('login_view', views.login_view),
    path('register_view', views.register_view),
    path('logout_view', views.logout_view),
    path('degree_plan_view', views.code_view)
]