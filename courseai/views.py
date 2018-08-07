from django.http import HttpResponse
from django.template import loader


def planner(request):
    template = loader.get_template('dynamic_pages/planner.html')
    context = {
        'degree_name': request.GET['degreeName'],
        'degree_code': request.GET['degreeCode'],
        'start_year': request.GET['startyear'],
        'start_sem': request.GET['semester']
    }
    return HttpResponse(template.render(context))
