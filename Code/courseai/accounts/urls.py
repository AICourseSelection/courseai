from . import views
from django.urls import path
from django.conf.urls import include, url

urlpatterns = [
    url(r'^ajax/login/$', views.login_view, name='login'),
    url(r'^ajax/register/$', views.register_view, name='register'),
    path('logout_view', views.logout_view),
]
