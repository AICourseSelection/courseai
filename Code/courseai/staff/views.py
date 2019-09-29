from django.http import JsonResponse
from django.shortcuts import render, redirect
import json

from django.views.decorators.csrf import csrf_exempt
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
    staffName = "Sayed Staff"
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


    bc_param = d_name + ' (' + year + ')'
    delete = request.GET.get('delete')
    safe = request.GET.get('safe')
    context = {
        'd_code': code,
        'd_name': d_name,
        'd_year': d_year,
        'bc_param': bc_param,
        'delete': delete,
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
    year_now = date.today().year
    years = [year_now - 5, year_now - 4, year_now - 3, year_now - 2, year_now - 1, year_now, year_now + 1]
    context = {
        'bc_param': bc_param,
        'year_now': year_now,
        'years': years,
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
    bc_param = 'Course (Add)'
    year_now = date.today().year
    years = [year_now - 5, year_now - 4, year_now - 3, year_now - 2, year_now - 1, year_now, year_now + 1]
    context = {
        'bc_param': bc_param,
        'year_now': year_now,
        'years': years,
    }
    return render(request, 'staff_pages/course_add.html', context=context)


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


@csrf_exempt
def save_course(request):
    # initiation
    response = 'success'
    msg = ''
    element = ''
    outcomes = request.POST.get('outcome').splitlines()
    code = request.POST.get('code')

    # validation goes here
    # all validation error must have response = 'validation' and msg = actual error message
    if len(code) > 5:
        response = 'validation'
        msg = 'Course Code Must be Less Than 6 Char!'
        element = 'code'

    # insert database goes here
    if not insert_db():
        response = 'database'

    return JsonResponse({'response': response, 'msg': msg, 'element': element})


def insert_db():
    # insert db function goes here
    return True
