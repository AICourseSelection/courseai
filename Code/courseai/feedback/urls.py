from django.urls import path

from . import views

urlpatterns = [
    path('give_feedback', views.give_feedback, name='give_feedback'),
]