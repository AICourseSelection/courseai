import json
import ast
import os
from builtins import Exception, eval, str
import pandas as pd

from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest, QueryDict
from django.shortcuts import render
from django.utils.crypto import get_random_string
from django.views.decorators.csrf import csrf_exempt

from recommendations import jsonhelper
from . import course_data_helper
from . import degree_plan_helper
from .models import Degree, PreviousStudentDegree, DegreePlanStore, degree_requirement, studyoption


def all_degrees(request):
    degree_list = pd.read_csv('degree/data/all_programs.csv', usecols=['code', 'title'])
    results = []


    for index, degree in degree_list.iterrows():
        results.append({"code": degree[0], "title": degree[1]})

    return JsonResponse({"response": results})


@csrf_exempt
def degree_plan(request):
    if request.method == "GET":
        try:
            code = request.GET['degree_code']
            year = request.GET['year']
            with open('static/json/study_options/{}.json'.format(code)) as f:
                study_options_str = f.read()
                study_options_dict = ast.literal_eval(study_options_str)
            return JsonResponse({"response": study_options_dict[year]})
        except Exception:
            res = JsonResponse(
                {"response": "Default options of the requested degree-year combination could not be found. "})
            return HttpResponseBadRequest(res)
    elif request.method == "PUT":
        data = request.body.decode('utf-8')
        code = json.loads(data)["code"]
        courses = json.loads(data)["courses"]
        prev = PreviousStudentDegree(code=code, courses_taken=courses)
        prev.save()
        degree = Degree.objects.filter(code=code)[0]
        degree.number_of_enrolments += 1
        metrics = eval(degree.metrics)
        for course_code in jsonhelper.parse_degree_json(data):
            if course_code == "Elective Course":
                continue
            metrics[course_code] = int(metrics[course_code]) + 1
        degree.metrics = str(metrics)
        degree.save()
        # no training
        # train_sample(Degree(code=code, requirements=courses))
        # for degree in degree_list:
        #     print({"code": degree.code, "courses_taken": degree.courses_taken})
        return JsonResponse({"response": "Success"})


def course_data(request):
    try:
        res = {"response": course_data_helper.get_course_data(request.GET['codes'])}
        return JsonResponse(res)
    except IndexError:
        res = JsonResponse({"response": "Please provide a valid course code"})
        return HttpResponseBadRequest(res)


def degree_reqs(request):
    try:
        code = request.GET['query']
        response = degree_plan_helper.get_degree_requirements(code)
        print(response)
        return HttpResponse(response, content_type="application/json")
    except Exception:
        res = JsonResponse({"response": "Requirements of the requested degree could not be found. "})
        return HttpResponseBadRequest(res)


@csrf_exempt
def stored_plans(request):
    if request.method == "GET":
        return retrieve_plan(request)
    elif request.method == "POST":
        return store_plan(request)
    elif request.method == "PUT":
        return update_plan(request)
    else:
        res = JsonResponse({"response": "Error, please provide a GET, POST, or PUT request"})
        return HttpResponseBadRequest(res)


def store_plan(request):
    data = request.body.decode('utf-8')
    proc = QueryDict(data)
    # generate a random code
    code = get_random_string(length=10)
    code = code.replace(" ", "c")
    plan = DegreePlanStore(code=code, plan=proc['plan'])
    plan.save()
    res = JsonResponse({"response": code})
    return HttpResponse(res)


def retrieve_plan(request):
    if not ('query' in request.GET):
        res = JsonResponse({"response": "error"})
        return HttpResponseBadRequest(res)
    code = request.GET['query']
    matched = DegreePlanStore.objects.filter(code=code)
    if (len(matched) == 0):
        res = JsonResponse({"response": "no matching plan found"})
        return HttpResponseBadRequest(res)
    degree_plan = matched[0]
    res = JsonResponse({"response": json.loads(degree_plan.plan)})
    return HttpResponse(res)


def update_plan(request):
    data = request.body.decode('utf-8')
    proc = QueryDict(data)
    code = proc['code']
    matched = DegreePlanStore.objects.filter(code=code)
    if len(matched) == 0:
        res = JsonResponse({"response": "no matching plan found"})
        return HttpResponseBadRequest(res)
    retrieved = matched[0]
    retrieved.plan = proc['plan']
    retrieved.save()
    res = JsonResponse({"response": "success"})
    return HttpResponse(res)


def update_degree_requirement(request):
    # Find the matching data
    year = request.GET['year']
    code = request.GET['code']

    dg_req = degree_requirement.objects.filter(code=code, year=year)[0]

    # Get the modified data and update the relative field
    dg_req.name = request.GET['name']
    dg_req.units = request.GET['units']
    compulsory_courses = request.GET['compulsory_courses']
    x_from_here = request.GET['x_from_here']

    # convert the string into json structure and assign new values
    dg_r = dg_req.required.replace("'", "\"")
    dg_r["compulsory_courses"] = compulsory_courses
    dg_r["x_from_here"] = x_from_here
    # convert the json into string and assign it to the field we are going to update
    dg_req.required = dg_r

    dg_req.save()

    res = JsonResponse({"response": "success"})
    return HttpResponse(res)


def delete(request):
    code = request.GET['code']
    type = request.GET['type']
    year = request.GET['year']
    print(code, type, year)
    res = JsonResponse({"response": "success"})
    return HttpResponse(res)

def saveDegree(request):
    code = request.GET['code']
    year = request.GET['year']
    planList=request.GET['planList']
    compulsoryList = request.GET['compulsoryList']
    print(planList)
    list_data = json.loads(planList)
    for i in list_data:
        print(i)
    res = JsonResponse({"response": "success"})
    return HttpResponse(res)

def saveCourse(request):
    code = request.GET['code']
    year = request.GET['year']
    units = request.GET['units']
    session = request.GET['sessions']
    description=request.GET['description']
    prerequisite=request.GET['prerequisite']
    incompatible=request.GET['incompatible']
    print(code,year,units,session,description,prerequisite,incompatible)
    res = JsonResponse({"response": "success"})
    return HttpResponse(res)

def saveMajor(request):
    code = request.GET['code']
    year = request.GET['year']
    title = request.GET['title']
    requirement= request.GET['requirement']
    print(code,year,title,requirement)
    res = JsonResponse({"response": "success"})
    return HttpResponse(res)

def saveMinor(request):
    res = JsonResponse({"response": "success"})
    return HttpResponse(res)

def saveSpec(request):
    res = JsonResponse({"response": "success"})
    return HttpResponse(res)

def addDegree(request):
    code = request.GET['code']
    year = request.GET['year']
    title = request.GET['title']
    planList = request.GET['planList']
    compulsoryList = request.GET['compulsoryList']
    print(code,year,planList,compulsoryList,title)
    res = JsonResponse({"response": "success"})
    return HttpResponse(res)

def addCourse(request):
    code = request.GET['code']
    year = request.GET['year']
    title = request.GET['title']
    unit = request.GET['unit']
    session = request.GET['session']
    description= request.GET['description']
    outcome = request.GET['outcome']
    prerequisiteList = request.GET['prerequisiteList']
    incompatibleList = request.GET['incompatibleList']
    print(code,year,title,unit,session,description,outcome,prerequisiteList,incompatibleList)
    res = JsonResponse({"response": "success"})
    return HttpResponse(res)

def addMajor(request):
    res = JsonResponse({"response": "success"})
    return HttpResponse(res)

def addMinor(request):
    res = JsonResponse({"response": "success"})
    return HttpResponse(res)

def addSpec(request):
    res = JsonResponse({"response": "success"})
    return HttpResponse(res)
def delete_degree(request):

    # Find the matching data

    year = request.GET['year']
    code = request.GET['code']

    dg_dg = degree_requirement.objects.filter(code=code, year=year)[0]

    # Delete all the data of this degree
    dg_dg.delete()

    res = JsonResponse({"response": "success"})

    return HttpResponse(res)


def create_degree(request):

    # Check if there is any same degree in the database
    year = request.GET['year']
    code = request.GET['code']

    dg_dg = degree_requirement.objects.filter(code=code, year=year)

    if len(dg_dg) == 0:

        # Create new degree when there is no same degree in the database
        dg_r = {}
        dg_r["compulsory_courses"] = request.GET['compulsory_courses']
        dg_r["x_from_here"] = request.GET['x_from_here']
        dg = degree_requirement(year=request.GET['year'], code=request.GET['code'],
                                name=request.GET['name'], units=request.GET['units'], required=dg_r)

        dg.save()

        res = JsonResponse({"response": "success"})

        return HttpResponse(res)











