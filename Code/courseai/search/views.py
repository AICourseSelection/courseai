from django.http import HttpResponse
from django.template import loader

from . import search
from degree.models import Degree

from degree import course_data_helper
import json
from search.nn import train_sample, initial_network_training, get_prediction
from django.http import JsonResponse, HttpResponse
from search.josnhelper import parse_degree_json
from search.recommendations import get_recommendations



def index(request):
    if 'query' not in request.GET:
        template = loader.get_template('static_pages/search.html')
        return HttpResponse(template.render({}, request))

    original_query = request.GET['query']
    filters = request.GET.get('filters', None)
    codes = None
    levels = None
    semesters = None

    if filters is not None:
        filters = json.loads(filters)
        print(filters)

        if 'codes' in filters and filters['codes']:
            codes = filters['codes']

        if 'levels' in filters and filters['levels']:
            levels = filters['levels']

        if 'semesters' in filters and filters['semesters']:
            semesters = filters['semesters']

    return search.execute_search(original_query, request, codes=codes, levels=levels, semesters_offered=semesters)

def recommend_course(request):
    plan = eval(request.GET['courses'])
    code = request.GET['code']
    course_list = parse_degree_json(request.GET['courses'])
    algo_recommended  = get_recommendations(course_list)
    d = Degree(code=code, requirements=str(plan))

    try:
        predictions, prediction_ratings = get_prediction(d, 20)
    except:
        to_return = []
        for course in algo_recommended:
            if(course in course_list):
                continue
            degree = Degree.objects.filter(code=code)[0]
            if (int(degree.number_of_enrolments) > 0):
                proportion = int(eval(degree.metrics)[course])*100 / int(degree.number_of_enrolments)
            else:
                proportion = 0
            to_return.append({"course":  course, "reasoning": '%.2f%% of students in your degree took this course' % proportion})
        return JsonResponse({"response": to_return})

    to_return = []

    response = course_data_helper.get_all()
    algo_courses_rec = 0

    for i in range(len(predictions)):

        course = predictions[i]
        course_rating = prediction_ratings[i]

        course-=1
        course_code = response[course]["_source"]['code']
        student_has_already_completed_course = course_code in course_list
        if(student_has_already_completed_course):
            continue

        if (course_rating<1):
            continue

        degree = Degree.objects.filter(code = code)[0]
        if (int(degree.number_of_enrolments) > 0):
            proportion = int(eval(degree.metrics)[course_code])*100 / int(degree.number_of_enrolments)
        else:
            proportion = 0
        course_list.append(course_code)
        to_return.append({"course":  course_code, "reasoning": '%.2f%% of students in your degree took this course.' % proportion })

    for course in algo_recommended:
        if (course in course_list):
            continue
        degree = Degree.objects.filter(code=code)[0]

        to_return.append(
            {"course": course, "reasoning": 'You have taken similar courses.'})
    return JsonResponse({"response": to_return})



