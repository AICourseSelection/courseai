from django.urls import path

from . import views

urlpatterns = [
    path('all', views.all_degrees, name='all_degrees'),
    path('degreeplan', views.degree_plan),
    path('degreereqs', views.degree_reqs),
    path('coursedata', views.course_data),
    path('stored_plans', views.stored_plans)
]

import os
import json
import django
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search
from elasticsearch_dsl.query import MultiMatch
from django.contrib.admin import AdminSite
from django.utils.translation import ugettext_lazy




def set_up_degree_requirements_db():
    # adds json object to db
    def add_to_db(data):
        year = data["year"]
        code = data["code"]
        name = data["name"]
        required = data["required"]
        units = data["units"]
        dr = DegreeRequirement(year=year, code=code, name=name, required=required, units=units)
        dr.save()

    from degree.models import DegreeRequirement

    for filename in os.listdir("static/json/"):
        try:
            with open('static/json/{}'.format(filename)) as file:
                add_to_db(json.loads(file.read()))
        except:
            pass

def sync_course_db():
    es_conn = Elasticsearch([os.environ.get("ES_IP")])

    res = es_conn.search(index='courseupdated',size=10000)

    results = []
    scroll_size = res['hits']['total']

    from degree.models import Course
    while (scroll_size > 0):
        try:
            results += res['hits']['hits']
            scroll_id = res['_scroll_id']
            res = es_conn.scroll(scroll_id=scroll_id, scroll='60s')
            scroll_size = len(res['hits']['hits'])
        except:
            break

    for result in results:
        es_id = result['_id']
        res_dict = result['_source']
        level = res_dict['level']
        graduation_stage=res_dict['ugpg']
        course_code = res_dict['course_code']
        area = res_dict['area']
        for year,version in res_dict['versions'].items():
            KEYS = ['units','title','sessions','prerequisite_text','prerequisites','description',
                    'convener','learning_outcomes','majors','minors']

            for key in KEYS:
                if not (key in version):
                    version[key] = ""

            prerequisite = ""
            if('pre-requisite' in version['prerequisites']):
                prerequisite = version['prerequisites']['pre-requisite']

            incompatability = ""
            if('incompatible' in version['prerequisites']):
                incompatability = version['prerequisites']['incompatible']

            min_units = ""
            if ('min_units' in version['prerequisites']):
                min_units = version['prerequisites']['min_units']

            course = Course(es_id = es_id,
                            units = version['units'],
                            name = version['title'],
                            code = course_code,
                            semesters = version['sessions'],
                            prerequisite_text=version['prerequisite_text'],
                            level= level,
                            area= area,
                            prerequisites = prerequisite,
                            incompatible = incompatability,
                            min_units = min_units,
                            description = version['description'],
                            convenor = version['convener'],
                            graduation_stage = graduation_stage,
                            year=year,
                            majors=version['majors'],
                            minors=version['minors'],
                            learning_outcomes=version['learning_outcomes'])
            course.save(no_es=True)


set_up_degree_requirements_db()
sync_course_db()
