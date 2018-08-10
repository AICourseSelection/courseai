from builtins import Exception, eval, str
from django.views.decorators.csrf import csrf_exempt

from django.http import JsonResponse, HttpResponse

from . import degree_plan_helper
from .models import Degree, PreviousStudentDegree

from . import course_data_helper
from recommendations import jsonhelper
from recommendations.nn import train_sample

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
        code = eval(data)["code"]
        courses = eval(data)["courses"]
        prev = PreviousStudentDegree(code=code, courses_taken=courses)
        prev.save()
        degree_list = PreviousStudentDegree.objects.all()
        degree = Degree.objects.filter(code=code)[0]
        degree.number_of_enrolments += 1
        metrics = eval(degree.metrics)
        for course_code in jsonhelper.parse_degree_json(data):
            if course_code == "Elective Course":
                continue
            metrics[course_code] = int(metrics[course_code]) + 1
        degree.metrics = str(metrics)
        degree.save()
        train_sample(Degree(code=code, requirements=courses))
        # for degree in degree_list:
        #     print({"code": degree.code, "courses_taken": degree.courses_taken})
        return JsonResponse({"response": "Success"})

def course_data(request):
    global es_conn
    try:
        query = request.GET['query']
        if query == 'titles':
            return JsonResponse({"response": course_data_helper.get_titles(request.GET.get('codes', '[]'))})
        elif query == 'prereqs':
            return JsonResponse({"response": course_data_helper.get_prereqs(request.GET.get('codes', '[]'))})
        else:
            return JsonResponse({"response": course_data_helper.get_data(query)})

    except Exception:
        raise Exception("Please provide a valid course code")


def degree_reqs(request):
    try:
        code = request.GET['query']
        response = degree_plan_helper.get_degree_requirements(code)
        return HttpResponse(response, content_type="application/json")
    except Exception:
        raise Exception("Requirements of the requested degree could not be found. ")
