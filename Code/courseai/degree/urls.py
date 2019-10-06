from django.urls import path

from . import views

urlpatterns = [
    path('all', views.all_degrees, name='all_degrees'),
    path('degreeplan', views.degree_plan),
    path('degreereqs', views.degree_reqs),
    path('coursedata', views.course_data),
    path('stored_plans', views.stored_plans),
    path('update_degree_requirement', views.update_degree_requirement),
    path('delete_degree', views.delete_degree),
    path('create_degree', views.create_degree)
    path('update_degree_requirement', views.update_degree_requirement),
    path('delete', views.delete),
    path('saveDegree', views.saveDegree),
    path('saveCourse', views.saveCourse),
    path('saveMajor', views.saveMajor),
    path('saveMinor', views.saveMinor),
    path('saveSpec', views.saveSpec),
    path('addDegree', views.addDegree),
    path('addCourse', views.addCourse),
    path('addMajor', views.addMajor),
    path('addMinor', views.addMinor),
    path('addSpec', views.addSpec),

]
