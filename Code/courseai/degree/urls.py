from django.urls import path

from . import views

urlpatterns = [
    path('all', views.all_degrees, name='all_degrees'),
    path('degreeplan', views.degree_plan),
    path('degreereqs', views.degree_reqs),
    path('coursedata', views.course_data),
    path('mms', views.mms_request),
    path('majors', views.all_majors),
    path('minors', views.all_minors),
    path('specs', views.all_specs),
    path('courselists', views.course_lists)
]
