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

    path('major', views.major, name='major'),
    path('major_detail', views.major_detail, name='major_detail'),
    path('major_add', views.major_add, name='major_add'),

    path('minor', views.minor, name='minor'),
    path('minor_detail', views.minor_detail, name='minor_detail'),
    path('minor_add', views.minor_add, name='minor_add'),

    path('specialisation', views.specialisation, name='specialisation'),
    path('specialisation_detail', views.specialisation_detail, name='specialisation_detail'),
    path('specialisation_add', views.specialisation_add, name='specialisation_add'),

    path('about', views.about, name='about'),
    path(r'course_save', views.course_save, name='course_save'),
    path(r'course_delete', views.course_delete, name='course_delete'),
    path('all_degrees', views.all_degrees),
    path(r'save_degree', views.save_degree, name='save_degree'),

]
