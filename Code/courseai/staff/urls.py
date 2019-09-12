from django.urls import path
from django.views.generic import TemplateView

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('degree', views.degree, name='degree'),
    path('degree_detail', views.degree_detail, name='degree_detail'),
    path('degree_add', views.degree_add, name='degree_add'),

    path('course', views.course, name='course'),
    path('course_detail', views.course_detail, name='course_detail'),
    path('course_add', views.course_add, name='course_add'),

    path('mms', views.mms, name='mms'),
    path('mms_detail', views.mms_detail, name='mms_detail'),
    path('mms_add', views.mms_add, name='mms_add'),

    path('all_degrees', views.all_degrees),
]
