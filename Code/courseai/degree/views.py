import json
from builtins import Exception, eval, str

from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest, QueryDict
from django.utils.crypto import get_random_string
from django.views.decorators.csrf import csrf_exempt

from recommendations import jsonhelper
from . import course_data_helper
from . import degree_plan_helper
from .models import Degree, PreviousStudentDegree, DegreePlanStore


def all_degrees(request):
    degree_list = Degree.objects.all()
    results = []

    for degree in degree_list:
        results.append({"code": degree.code, "title": degree.name})

    return JsonResponse({"response": results})


@csrf_exempt
def degree_plan(request):
    if request.method == "GET":
        try:
            code = request.GET['query']
            starting_year = request.GET['start_year_sem']
            return degree_plan_helper.generate_degree_plan(code, starting_year)
        except Exception:
            return JsonResponse({"response": "null"})
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
        query = request.GET['query']
        if query == 'titles':
            return JsonResponse({"response": course_data_helper.get_titles(request.GET.get('codes', '[]'))})
        elif query == 'prereqs':
            return JsonResponse({"response": course_data_helper.get_prereqs(request.GET.get('codes', '[]'))})
        elif query == 'multiple':
            return JsonResponse({"response": course_data_helper.get_multiple(request.GET.get('codes', '[]'))})
        else:
            return JsonResponse({"response": course_data_helper.get_data(query)})

    except Exception:
        res = JsonResponse({"response": "Please provide a valid course code"})
        return HttpResponseBadRequest(res)


def degree_reqs(request):
    try:
        code = request.GET['query']
        response = degree_plan_helper.get_degree_requirements(code)
        return HttpResponse(response, content_type="application/json")
    except Exception:
        res = JsonResponse({"response": "Requirements of the requested degree could not be found. "})
        raise HttpResponseBadRequest(res)


@csrf_exempt
def stored_plans(request):
    if (request.method == "GET"):
        return retrieve_plan(request)
    elif (request.method == "POST"):
        return store_plan(request)
    elif (request.method == "PUT"):
        return update_plan(request)
    else:
        res = JsonResponse({"response": "Error, please provide a GET, POST, or PUT request"})
        return HttpResponseBadRequest(res)


def store_plan(request):
    data = request.body.decode('utf-8')
    proc = QueryDict(data)
    # generate a random code
    code = get_random_string(length=10)
    code = code.replace(" ","c")
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
    if (len(matched) == 0):
        res = JsonResponse({"response": "no matching plan found"})
        return HttpResponseBadRequest(res)
    retrieved = matched[0]
    retrieved.plan = proc['plan']
    retrieved.save()
    res = JsonResponse({"response": "success"})
    return HttpResponse(res)
