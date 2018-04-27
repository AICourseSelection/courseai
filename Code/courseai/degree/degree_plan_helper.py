from builtins import eval

from django.http import JsonResponse

from .models import Degree


def advance_sem(year, sem):
    return (year, 2) if sem is 1 else (year + 1, 1)


def generate_degree_plan(code, start_year_sem):
    degree = Degree.objects.filter(code=code)[0]
    reqs = degree.requirements
    to_return = []
    year, sem = start_year_sem.split('S')
    year, sem = int(year), int(sem)
    for year_sem, courses in eval(reqs).items():
        to_return.append({'{}S{}'.format(year, sem): courses})
        year, sem = advance_sem(year, sem)
    return JsonResponse({"response": to_return})
