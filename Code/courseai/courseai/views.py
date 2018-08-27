from django.http import HttpResponse
from django.template import loader
from django.shortcuts import render


def planner(request):
    template = loader.get_template('dynamic_pages/planner.html')
    user = None
    if not request.user is None:
        user = request.user
    
    context = {
        'degree_name': request.GET['degreeName'],
        'degree_code': request.GET['degreeCode'],
        'degree_name2': request.GET['degreeName2'],
        'degree_code2': request.GET['degreeCode2'],
        'start_year': request.GET['startyear'],
        'start_sem': request.GET['semester'],
        'user': user
    }
    return HttpResponse(template.render(context))
