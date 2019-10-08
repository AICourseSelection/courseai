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
from .models import Degree, PreviousStudentDegree, DegreePlanStore, degree_requirement, studyoption, Course, all_program


def all_degrees(request):
    # degree_list = pd.read_csv('degree/data/all_programs.csv', usecols=['code', 'title'])
    degree_list = all_program.objects.filter()
    # degree_list = pd.r(all_program)
    results = []



    for degree in degree_list:
        results.append({"code": degree.code, "title": degree.title})

    return JsonResponse({"response": results})


@csrf_exempt
def degree_plan(request):
    if request.method == "GET":
        try:
            code = request.GET['degree_code']
            year = request.GET['year']
            code_year = code + '' + year

            st_op = studyoption.objects.filter(code_year=code_year)[0]
            study_options_dict = ast.literal_eval(st_op.option)
            #with open('static/json/study_options/{}.json'.format(code)) as f:
            #    study_options_str = f.read()
            #    study_options_dict = ast.literal_eval(study_options_str)
            #    print(study_options_dict[year])
            return JsonResponse({"response": study_options_dict})
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
    # code_year = code + '' + year

    dg_req = degree_requirement.objects.filter(code=code, year=year)[0]
    # st_op = studyoption.objects.filter(code_year=code_year)[0]

    # Get the modified data and update the relative field
    compulsory_courses = request.GET['compulsoryList']
    # planList = request.GET['planList']

    # convert the string into json structure and assign new values
    # st_op.option = planList
    dg_r = json.loads(dg_req.required)
    dg_r['compulsory_courses'] = ast.literal_eval(compulsory_courses)
    # convert the json into string and assign it to the field we are going to update
    dg_req.required = json.dumps(dg_r)

    dg_req.save()
    # st_op.save()

    res = JsonResponse({"response": "success"})
    return HttpResponse(res)


def delete(request):
    code = request.GET['code']
    type = request.GET['type']

    year = request.GET['year']
    print(code, type, year)
    dg_dg = degree_requirement.objects.filter(code=code, year=year)[0]
    dg_all = all_program.objects.filter(code=code)[0]
    dg_all.delete()
    # Delete all the data of this degree
    dg_dg.delete()
    res = JsonResponse({"response": "success"})
    return HttpResponse(res)


# def saveDegree(request):
#     code = request.GET['code']
#     year = request.GET['year']
#     title = request.GET['title']
#     planList = request.GET['planList']
#     units_list = json.loads(planList)
#     units = len(units_list) * 6
#     compulsoryList = request.GET['compulsoryList']
#     print(planList)
#     # list_data = json.loads(planList)
#     list_data = json.loads(compulsoryList)
#
#     # for i in list_data:
#     #     print(i)
#
#     dg_req = degree_requirement.objects.filter(code=code, year=year)[0]
#     dg_req.name = title
#     dg_req.units = units
#     dg_req.required = list_data
#
#     dg_req.save()
#
#     res = JsonResponse({"response": "success"})
#     return HttpResponse(res)



def saveCourse(request):
    code = request.GET['code']
    year = request.GET['year']
    units = request.GET['units']
    session = request.GET['sessions']
    description = request.GET['description']
    prerequisite = request.GET['prerequisite']
    incompatible = request.GET['incompatible']
    c = Course(code=code, year=year, units=units,semesters=session, description=description,
              prerequisites=prerequisite, incompatible=incompatible)
    c.save()
    print("saved")
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
    code_year = code + "" + year
    title = request.GET['title']
    planList = request.GET['planList']
    plan_list = json.loads(planList)
    compulsoryList = request.GET['compulsoryList']
    CompulsoryList = json.loads(compulsoryList)
    print(code, year, planList, compulsoryList, title)
    units = len(plan_list) * 6
    dg_dg = degree_requirement.objects.filter(code=code, year=year)

    if len(dg_dg) == 0:
        # Create degree

        st = studyoption(code_year=code_year, option=planList)
        ob = all_program(code=code, title=title)
        dg = degree_requirement(year=year, code=code,
                                name=title, units=units, required=CompulsoryList)
        st.save()
        ob.save()
        dg.save()

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
    c = Course(code=code, year=year, units=unit, semesters=session, description=description,
               prerequisites=prerequisiteList, incompatible=incompatibleList, name=title, learning_outcomes=outcome)

    print(c.creation_id)
    print(c)
    c.save()
    print("saved")
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












