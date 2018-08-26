from django.http import HttpResponse
from django.template import loader


def planner(request):
    template = loader.get_template('dynamic_pages/planner.html')
    user = None
    if not request.user is None:
        user = request.user
    
    context = {
        'degree_name': request.GET['degreeName'],
        'degree_code': request.GET['degreeCode'],
        'start_year': request.GET['startyear'],
        'start_sem': request.GET['semester'],
        'user': user
    }
    return HttpResponse(template.render(context))
    
#def get_user_profile(request, user):
#   return render(request, 'dynamic_pages/user_profile.html', {'user': user})
