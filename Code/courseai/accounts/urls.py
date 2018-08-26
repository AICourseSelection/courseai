from . import views
from django.urls import path
from django.conf.urls import include, url

urlpatterns = [
    path('login_view', views.login_view, name='login'),
    path('register_view', views.register_view, name='register'),
    path('logout_view', views.logout_view),
    path('degree_plan_view', views.code_view)
]
