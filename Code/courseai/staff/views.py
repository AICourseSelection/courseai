from django.http import JsonResponse
from django.shortcuts import render, redirect
import json
import random
from elasticsearch_dsl import Search, Q
from elasticsearch_dsl.query import MultiMatch
import ast
import sys
import degree.views as degree
from degree import degree_plan_helper
import pandas as pd
from datetime import date
from django.contrib import messages
from .forms import BookFormset

from django import forms;
from django.forms.formsets import formset_factory;
from django.shortcuts import render_to_response

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
    staffname = ["Doctor Sayed Staff", "Doctor Yichen Staff", "Professor Donny Staff", "Ken Staff",
                 "Doctor Zifeng Staff", "Rui Staff"]
    staffName = staffname[random.randint(0,len(staffname)-1)]
    return staffName


def degree(request):
    bc_param = 'Degree'
    context = {
        'bc_param': bc_param
    }
    return render(request, 'staff_pages/degree.html', context=context)


def degree_detail(request):
    code = request.GET.get('code')
    year = request.GET.get('year')
    d_name = request.GET.get('title')
    d_year = year
    plan1 = get_plan1(code, year)

    specs = get_spec(request)
    spec_row = len(specs)

    comps = get_comp(request)
    comp_row = len(comps)

    bc_param = d_name + ' (' + year + ')'
    delete = request.GET.get('delete')
    mode = request.GET.get('mode')
    safe = request.GET.get('safe')
    context = {
        'd_code': code,
        'd_name': d_name,
        'd_year': d_year,
        'comps': comps,
        'specs': specs,
        'plan1': plan1,
        'spec_row': spec_row,
        'comp_row': comp_row,
        'bc_param': bc_param,
        'delete': delete,
        'mode': mode
    }
    if delete == 'false':
        messages.success(request, 'You have successfully restore ' + bc_param + '!')
    elif safe == 'true':
        messages.success(request, 'You have successfully update ' + bc_param + '!')

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
    if request.method == 'POST':
        # params
        code = request.POST['code']
        # Validation goes here
        # sample
        if len(code) > 5:
            messages.error(request, 'Code can\'t be more than 5 char!')
        return redirect('degree_add')
    else:
        bc_param = 'Course'
        year_now = date.today().year
        years = [year_now - 5, year_now - 4, year_now - 3, year_now - 2, year_now - 1, year_now, year_now + 1]
        context = {
            'bc_param': bc_param,
            'year_now': year_now,
            'years': years,
        }
        return render(request, 'staff_pages/degree_add.html', context=context)


def course(request):
    bc_param = 'Course'
    context = {
        'bc_param': bc_param,
    }
    return render(request, 'staff_pages/course.html', context=context)



def course_detail(request):
    code = request.GET.get('code')
    c_name = request.GET.get('title')
    c_year = request.GET.get('year')
    bc_param = code + ' (' + c_year + ')'
    context = {
        'c_code': code,
        'c_year': c_year,
        'c_name': c_name,
        'bc_param': bc_param,
    }
    return render(request, 'staff_pages/course_detail.html', context=context)


def course_add(request):
    return render(request, 'staff_pages/course_add.html')


def major(request):
    bc_param = 'Major'
    context = {
        'bc_param': bc_param,
    }
    return render(request, 'staff_pages/major.html', context=context)


def major_detail(request):
    code = request.GET.get('code')
    year = request.GET.get('year')
    bc_param = code + ' (' + year + ')'
    context = {
        'major_code': code,
        'major_year': year,
        'bc_param': bc_param,
    }
    return render(request, 'staff_pages/major_detail.html', context=context)


def major_add(request):
    return render(request, 'staff_pages/major_add.html')


def minor(request):
    bc_param = 'Minor'
    context = {
        'bc_param': bc_param,
    }
    return render(request, 'staff_pages/minor.html', context=context)


def minor_detail(request):
    code = request.GET.get('code')
    year = request.GET.get('year')
    bc_param = code + ' (' + year + ')'
    context = {
        'minor_code': code,
        'minor_year': year,
        'bc_param': bc_param
    }
    return render(request, 'staff_pages/minor_detail.html', context=context)


def minor_add(request):
    return render(request, 'staff_pages/minor_add.html')


def specialisation(request):
    bc_param = 'Specialisation'
    context = {
        'bc_param': bc_param,
    }
    return render(request, 'staff_pages/specialisation.html', context=context)


def specialisation_detail(request):
    code = request.GET.get('code')
    year = request.GET.get('year')
    bc_param = code + ' (' + year + ')'
    context = {
        'spec_code': code,
        'spec_year': year,
        'bc_param': bc_param,
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


def save_degree(request):
    return render(request, 'staff_pages/about.html')


def create_book_normal(request):
    template_name = 'store/create_normal.html'
    heading_message = 'Formset Demo'
    if request.method == 'GET':
        formset = BookFormset(request.GET or None)
    elif request.method == 'POST':
        formset = BookFormset(request.POST)
        if formset.is_valid():
            for form in formset:
                # extract name from each form and save
                name = form.cleaned_data.get('name')
                # save book instance
                # if name:
                #     Book(name=name).save()
            # once all books are saved, redirect to book list view
            return redirect('book_list')
    return render(request, template_name, {
        'formset': formset,
        'heading': heading_message,
    })


def saveCourses(request):
    print(request)
    print(request.GET.get("course_code"));
    print(request.GET.get("year"));
    print(request.GET.get("description"));
    return JsonResponse({"response": "Success"})
