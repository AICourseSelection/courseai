from django.shortcuts import render
import json
from django.http import HttpResponse, JsonResponse
import sys
import degree.views as degree
from degree import degree_plan_helper
import pandas as pd

# Create your views here.
def index(request):
    notification = get_notification()
    staff_name = get_name()
    context = {
        'notification': notification,
        'staffName': staff_name,
    }
    return render(request, 'staff_pages/index.html', context=context)


def get_notification():
    notifiction = "This is a dummy notification"
    return notifiction


def get_name():
    staffName = "Sayed Staff"
    return staffName


def degree(request):
    return render(request, 'staff_pages/degree.html')


def degree_detail(request):
    code = request.GET.get('code')
    year = request.GET.get('year')
    d_name = request.GET.get('title')
    d_year = year
    plan1 = get_plan1()

    specs = get_spec(request)
    spec_row = len(specs)

    comps = get_comp(request)
    comp_row = len(comps)

    context = {
        'd_code': code,
        'd_name': d_name,
        'd_year': d_year,
        'comps': comps,
        'specs': specs,
        'plan1': plan1,
        'spec_row': spec_row,
        'comp_row': comp_row,
    }
    return render(request, 'staff_pages/degree_detail.html', context=context)


def get_comp(request):
    code = request.GET.get('code')
    response = degree_plan_helper.get_degree_requirements(code)
    complusoryCourse=json.loads(response)
    comps =complusoryCourse['required']['compulsory_courses']
    return comps


def get_spec(request):
    code = request.GET.get('code')
    response = degree_plan_helper.get_degree_requirements(code)
    complusoryCourse = json.loads(response)
    specs = complusoryCourse['required']['required_m/m/s']
    return specs


def get_plan1():
    return Plan1()


class Plan1:
    def __init__(self):
        self.str = "Plan1"
        self.course1 = "COMP-A"
        self.course2 = "COMP-B"
        self.course3 = "COMP-C"
        self.course4 = "COMP-D"
        self.course5 = "COMP-E"
        self.course6 = "COMP-F"
        self.course7 = "COMP-G"
        self.course8 = "COMP-H"
        self.course9 = "COMP-I"
        self.course10 = "COMP-J"
        self.course11 = "COMP-K"
        self.course12 = "COMP-L"
        self.course13 = "COMP-M"
        self.course14 = "COMP-N"
        self.course15 = "COMP-O"
        self.course16 = "COMP-P"







def degree_add(request):
    return render(request, 'staff_pages/degree_add.html')


def course(request):
    return render(request, 'staff_pages/course.html')


def course_detail(request):
    return render(request, 'staff_pages/course_detail.html')


def course_add(request):
    return render(request, 'staff_pages/course_add.html')


def mms(request):
    return render(request, 'staff_pages/mms.html')


def mms_detail(request):
    return render(request, 'staff_pages/mms_detail.html')


def mms_add(request):
    return render(request, 'staff_pages/mms_add.html')


def all_degrees(request):
    degree_list = pd.read_csv('staff/static/etc/all_programs.csv', usecols=['code', 'title'])
    results = []

    for index, degree in degree_list.iterrows():
        results.append({"code": degree[0], "title": degree[1]})
    return JsonResponse({"response": results})
