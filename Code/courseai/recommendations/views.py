from degree.models import Degree

from degree import course_data_helper
from recommendations.nn import get_prediction
from django.http import JsonResponse
from recommendations.jsonhelper import parse_degree_json
from .recommendations import get_recommendations

# Create your views here.


def recommend_course(request):
    plan = eval(request.GET['courses'])
    code = request.GET['code']
    course_list = parse_degree_json(request.GET['courses'])
    algo_recommended = get_recommendations(course_list)
    d = Degree(code=code, requirements=str(plan))

    try:
        predictions, prediction_ratings = get_prediction(d, 20)
    except:
        to_return = []
        for course in algo_recommended:
            if course in course_list:
                continue
            degree = Degree.objects.filter(code=code)[0]
            if int(degree.number_of_enrolments) > 0:
                proportion = int(eval(degree.metrics)[course]) * 100 / int(degree.number_of_enrolments)
            else:
                proportion = 0
            to_return.append(
                {"course": course, "reasoning": '%.2f%% of students in your degree chose this course' % proportion})
        return JsonResponse({"response": to_return})

    to_return = []

    response = course_data_helper.get_all()

    for i in range(len(predictions)):

        course = predictions[i]
        course_rating = prediction_ratings[i]

        course -= 1
        course_code = response[course]["_source"]['code']
        student_has_already_completed_course = course_code in course_list
        if student_has_already_completed_course:
            continue

        if course_rating < 1:
            continue

        degree = Degree.objects.filter(code=code)[0]
        if int(degree.number_of_enrolments) > 0:
            proportion = int(eval(degree.metrics)[course_code]) * 100 / int(degree.number_of_enrolments)
        else:
            proportion = 0
        course_list.append(course_code)
        to_return.append(
            {"course": course_code, "reasoning": '%.2f%% of students in your degree chose this course.' % proportion})

    for course in algo_recommended:
        if course in course_list:
            continue

        to_return.append(
            {"course": course, "reasoning": 'You have taken similar courses.'})
    return JsonResponse({"response": to_return})
