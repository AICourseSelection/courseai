from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
import pandas as pd


# Create your views here.
def index(request):
    notification = get_notification()
    staff_name = get_name()
    context = {
        'notification': notification,
        'staff_name': staff_name,
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
    d_name = get_degree(code, year)
    d_year = year
    d_comp = "comp"
    plan1 = get_plan1()
    plan2 = get_plan2()

    specs = get_spec()
    spec_row = len(specs)

    comps = get_comp()
    comp_row = len(comps)

    context = {
        'd_code': code,
        'd_name': d_name,
        'd_year': d_year,
        'comps': comps,
        'specs': specs,
        'plan1': plan1,
        'plan2': plan2,
        'spec_row': spec_row,
        'comp_row': comp_row,
    }
    return render(request, 'staff_pages/degree_detail.html', context=context)


def get_comp():
    comps = ["COMP6710 - Structured Programming", "COMP6250 - Prof Prac 1",
             "COMP6442 - Software Construction", "COMP8110 - Sftwre Proj in Systems Context", "COMP8260 - Prof Prac 2"]
    return comps


def get_spec():
    specs = ["ARTIF-SPEC - Artificial Intelligence", "MCHL-SPEC - Machine Learning",
             "DTSC-SPEC - Data Science", "HCSD-SPEC - Human Centred Design and Software Development"]
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


def get_plan2():
    return Plan2()


class Plan2:
    def __init__(self):
        self.str = "Plan2"
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


def get_degree(code, year):
    name = "Master Of Computing"
    return name


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
