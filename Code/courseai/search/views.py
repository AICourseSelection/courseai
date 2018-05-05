from django.http import HttpResponse
from django.template import loader

from . import search
from degree.models import Degree

from degree import course_data_helper

import json


def index(request):
    if 'query' not in request.GET:
        template = loader.get_template('static_pages/search.html')
        return HttpResponse(template.render({}, request))

    original_query = request.GET['query']
    filters = request.GET.get('filters', None)
    codes = None
    levels = None

    if filters is not None:
        filters = json.loads(filters)

        if 'codes' in filters:
            codes = filters['codes']

        if 'levels' in filters:
            levels = filters['levels']

    return search.execute_search(original_query, request, codes=codes, levels=levels)

def recommend_course(request):
    plan = eval(request.GET['degree_plan'])
    code = request.GET['degree_code']
    d = Degree(code=code, requirements=plan)
    try:
        predictions = get_prediction(d,10)
        to_return=[]

        response = course_data_helper.get_all()
        for course in predictions:
            print("******",response[course]['code'])
            course_code = response[course]['code']
            degree = Degree.objects.filter(code == course_code)
            proportion = int(degree.metrics[course_code])/int(degree.number_of_enrolments)
            to_return.append({"course" : course,"reasoning":  '%.2f of students in your degree took this course' % proportion})
        return JsonResponse({"response":to_return})
    except:
        print("network not trained, switch to search")
    return JsonResponse({"Recommendations":predictions})
