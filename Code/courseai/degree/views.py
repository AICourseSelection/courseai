from builtins import Exception

from django.http import JsonResponse

from . import degree_plan_helper
from . import initialiser
from .models import Degree


from . import course_data_helper

# initialiser.initialise_database()

def all_degrees(request):

    degree_list = Degree.objects.all()
    results = []

    for degree in degree_list:
        results.append({"code": degree.code, "title": degree.name})

    return JsonResponse({"response": results})

def degree_plan(request):
    try:
        code=request.GET['query']
        starting_year=request.GET['start_year_sem']
        return degree_plan_helper.generate_degree_plan(code, starting_year)
    except(Exception):
        raise Exception("Please provide a valid degree code and starting year")

def course_data(request):

    try:
        code=request.GET['query']
        return JsonResponse({"response": course_data_helper.get_data(code)})
    except(Exception):
        raise Exception("Please provide a valid course code")










