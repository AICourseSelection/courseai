import json
from builtins import eval

from django.http import JsonResponse

from .models import Degree


def advance_sem(year, sem):
    return (year, 2) if sem is 1 else (year + 1, 1)


def update_elective_code(c):
    if 'title' in c:
        # if (c['title'].lower() == "elective course"):
        #     c['code'] = "Elective Course"
        if 'code' not in c:
            c['code'] = 'Elective Course'
            c.pop('title')
    return c


def generate_degree_plan(code, start_year_sem):
    degree = Degree.objects.filter(code=code)[0]
    reqs = degree.requirements
    if reqs == "{}":
        reqs = dict()
        final_year = 3
        if "Honours" in degree.name:
            final_year = 4
        for i in range(1, final_year + 1):
            for j in range(1, 3):
                reqs[str(i) + "." + str(j)] = [{"title": 'Elective Course'}]
    to_return = []
    year, sem = start_year_sem.split('S')
    year, sem = int(year), int(sem)
    for year_sem, courses in sorted(eval(str(reqs)).items(), key=lambda session: float(session[0])):
        print(len(courses))
        for c in courses:
            update_elective_code(c)
            if c['code'] == "OR":
                c['code'] = 'Elective Course'
        if len(courses) < 4:
            for i in range(4 - len(courses)):
                courses.append({"code": 'Elective Course'})
        to_return.append({'{}S{}'.format(year, sem): courses[0:4]})
        year, sem = advance_sem(year, sem)
    return JsonResponse({"response": to_return})


def get_degree_requirements(code):
    with open('static/json/{}.json'.format(code)) as file:
        return file.read()
