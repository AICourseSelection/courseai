from django.contrib import admin
from .models import Degree
from .models import DegreeRequirement
from .models import Course
import os
import json
import django
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search
from elasticsearch_dsl.query import MultiMatch
from django.contrib.admin import AdminSite
from django.utils.translation import ugettext_lazy


# Register your models here.

class CourseAdmin(admin.ModelAdmin):
    search_fields = ('name','code')

class DegreeRequirementAdmin(admin.ModelAdmin):
    search_fields = ('name','code')

admin.site.register(Degree)
admin.site.register(DegreeRequirement,DegreeRequirementAdmin)
admin.site.register(Course, CourseAdmin)

"""
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
            KEYS = ['units','title','sessions','prerequisite_text','prerequisites','description','convener']

            for key in KEYS:
                if not (key in version):
                    version[key] = ""

            course = Course(es_id = es_id,
                            units = version['units'],
                            name = version['title'],
                            code = course_code,
                            semesters = version['sessions'],
                            prerequisite_text=version['prerequisite_text'],
                            level= level,
                            area= area,
                            prerequisites = version['prerequisites'],
                            description = version['description'],
                            convenor = version['convener'],
                            graduation_stage = graduation_stage,
                            year=year)
            course.save(no_es=True)


set_up_degree_requirements_db()
sync_course_db()"""

