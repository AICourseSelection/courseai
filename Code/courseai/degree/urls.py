from django.urls import path

from . import views

urlpatterns = [
    path('all', views.all_degrees, name='all_degrees'),
    path('degreeplan', views.degree_plan),
    path('degreereqs', views.degree_reqs),
    path('coursedata', views.course_data),
    path('stored_plans', views.stored_plans)
]


#to be moved eventually
from .models import DegreeRequirement, Major, Course, Minor, Specialisation
from .sync import set_up_degree_requirements_db, sync_major_db, sync_course_db, sync_minor_db,sync_spec_db
"""
#clean db
print("Cleaning db...")
DegreeRequirement.objects.all().delete()
Major.objects.all().delete()
Course.objects.all().delete()
Minor.objects.all().delete()
Specialisation.objects.all().delete()

#sync db
print("Initialising requirements...")
set_up_degree_requirements_db()
print("Syncing majors with Elastic Search...")
sync_major_db()
print("Syncing courses with Elastic Search...")
sync_course_db()
print("Syncing minors with Elastic Search...")
sync_minor_db()
print("Syncing specialisations with Elastic Search...")
sync_spec_db()
"""