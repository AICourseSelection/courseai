from builtins import eval, int, str
from django.http import JsonResponse

from .models import Degree
def is_sem(year_sem,s):
    return year_sem.split(".")[0] == s

def generate_degree_plan(code, starting_year):
    degree = Degree.objects.filter(code=code)[0]
    reqs = degree.requirements
    to_return = []
    for year_sem, courses in eval(reqs).items():
        if (is_sem(year_sem,"1")):
            time = str(int(starting_year[:-2]) - 1 + int(year_sem.split(".")[0])) + "S" + year_sem.split(".")[1]
        else:
            if (int(year_sem.split(".")[1]) == 2):
                time = str(int(starting_year[:-2]) + int(year_sem.split(".")[0])) + "S" + str(int(year_sem.split(".")[1]) - 1)
            else:
                time = str(int(starting_year[:-2]) - 1 + int(year_sem.split(".")[0])) + "S" + year_sem.split(".")[1]
        to_return.append({time: courses})
    return JsonResponse({"response": to_return})