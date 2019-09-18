from django.http import JsonResponse
from django.shortcuts import render
import json
from elasticsearch_dsl import Search, Q
from elasticsearch_dsl.query import MultiMatch
import ast
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
    plan1 = get_plan1(code,year)

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


def get_plan1(code,year):
    with open('static/json/study_options/{}.json'.format(code)) as f:
        study_options_str = f.read()
        study_options_dict = ast.literal_eval(study_options_str)
        print(study_options_dict[year])
        plan=Plan1()
        plan.str="Plan1"
        plan.course1 = study_options_dict[year][0][0]['code']
        plan.course2 = study_options_dict[year][0][1]['code']
        plan.course3 = study_options_dict[year][0][2]['code']
        plan.course4 = study_options_dict[year][0][3]['code']
        plan.course5 = study_options_dict[year][1][0]['code']
        plan.course6 = study_options_dict[year][1][1]['code']
        plan.course7 = study_options_dict[year][1][2]['code']
        plan.course8 = study_options_dict[year][1][3]['code']
        plan.course9 = study_options_dict[year][2][0]['code']
        plan.course10 = study_options_dict[year][2][1]['code']
        plan.course11 = study_options_dict[year][2][2]['code']
        plan.course12 = study_options_dict[year][2][3]['code']
        plan.course13 = study_options_dict[year][3][0]['code']
        plan.course14 = study_options_dict[year][3][1]['code']
        plan.course15 = study_options_dict[year][3][2]['code']
        plan.course16 = study_options_dict[year][3][3]['code']
    return plan


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
    code = request.GET.get('code')
    c_name = request.GET.get('title')
    c_year = request.GET.get('year')
    context = {
        'c_code': code,
        'c_year': c_year,
        'c_name': c_name,
    }
    return render(request, 'staff_pages/course_detail.html', context=context)


def course_add(request):
    return render(request, 'staff_pages/course_add.html')


def major(request):
    return render(request, 'staff_pages/major.html')


def major_detail(request):
    code = request.GET.get('code')
    year = request.GET.get('year')
    context = {
        'major_code': code,
        'major_year': year,
    }
    return render(request, 'staff_pages/major_detail.html', context=context)


def major_add(request):
    return render(request, 'staff_pages/major_add.html')


def minor(request):
    return render(request, 'staff_pages/minor.html')


def minor_detail(request):
    code = request.GET.get('code')
    year = request.GET.get('year')
    context = {
        'minor_code': code,
        'minor_year': year,
    }
    return render(request, 'staff_pages/minor_detail.html', context=context)


def minor_add(request):
    return render(request, 'staff_pages/minor_add.html')


def specialisation(request):
    return render(request, 'staff_pages/specialisation.html')


def specialisation_detail(request):
    code = request.GET.get('code')
    year = request.GET.get('year')
    context = {
        'spec_code': code,
        'spec_year': year,
    }
    return render(request, 'staff_pages/specialisation_detail.html', context=context)


def specialisation_add(request):
    return render(request, 'staff_pages/specialisation_add.html')


def all_degrees(request):
    degree_list = pd.read_csv('staff/static/etc/all_programs.csv', usecols=['code', 'title'])
    results = []

    for index, degree in degree_list.iterrows():
        results.append({"code": degree[0], "title": degree[1]})
    return JsonResponse({"response": results})


def about(request):
    return render(request, 'staff_pages/about.html')
