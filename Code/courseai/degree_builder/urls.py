from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('get_degree', views.get_degree, name='get_degree'),
    path('update_degree', views.update_degree, name='update_degree'),
]