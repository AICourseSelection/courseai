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
]
