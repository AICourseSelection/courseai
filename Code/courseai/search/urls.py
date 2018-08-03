from django.urls import path

from . import views

urlpatterns = [
    path('coursesearch/', views.index, name='index')
]
