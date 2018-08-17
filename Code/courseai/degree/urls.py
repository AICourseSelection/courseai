from django.urls import path

from . import views

urlpatterns = [
    path('all', views.all_degrees, name='all_degrees'),
    path('degreeplan', views.degree_plan),
    path('degreereqs', views.degree_reqs),
    path('coursedata', views.course_data),
    path('store_plan', views.store_plan),
    path('retrieve_plan', views.retrieve_plan),
    path('update_plan', views.update_plan)
]
