from builtins import Exception, eval, str
from django.views.decorators.csrf import csrf_exempt

import json
from django.http import JsonResponse

from . import degree_plan_helper
from . import mms
from . import initialiser
from .models import Degree, PreviousStudentDegree

from . import course_data_helper


def all_degrees(request):
    degree_list = Degree.objects.all()
    results = []

    for degree in degree_list:
        results.append({"code": degree.code, "title": degree.name})

    return JsonResponse({"response": results})


# this method is unsafe for now
@csrf_exempt
def degree_plan(request):
    if request.method == "GET":
        try:
            code = request.GET['query']
            starting_year = request.GET['start_year_sem']
            return degree_plan_helper.generate_degree_plan(code, starting_year)
        except(Exception):
            raise Exception("Please provide a valid degree code and starting year")
    elif request.method == "PUT":
        data = request.body.decode('utf-8')

        print(eval(data))

        code = eval(data)["code"]
        courses = eval(data)["courses"]
        prev = PreviousStudentDegree(code=code, courses_taken=courses)
        prev.save()
        degree_list = PreviousStudentDegree.objects.all()

        for degree in degree_list:
            print({"code": degree.code, "courses_taken": degree.courses_taken})
        return JsonResponse({"response": "Success"})


def mms_request(request):
    try:
        code = request.GET['query']
        print(code)
        return mms.get_mms_data(code)
    except:
        raise Exception("Malformed JSON as input. Expects a field called query.")


def all_majors(request):
    try:
        name = request.GET['query']
        return mms.mms_by_name(name, 'majors')
    except:
        return mms.all_majors()


def all_minors(request):
    try:
        name = request.GET['query']
        return mms.mms_by_name(name, 'minors')
    except:
        return mms.all_minors()


def all_specs(request):
    try:
        name = request.GET['query']
        return mms.mms_by_name(name, 'specialisations')
    except:
        return mms.all_specs()


def course_data(request):
    try:
        code = request.GET['query']
        return JsonResponse({"response": course_data_helper.get_data(code)})
    except(Exception):
        raise Exception("Please provide a valid course code")


def major_name(request):
    return