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
    year_now = date.today().year
    years = [year_now - 5, year_now - 4, year_now - 3, year_now - 2, year_now - 1, year_now, year_now + 1]
    msg_param = ''
    show_message = False

    if request.method == 'GET' and 'msg_param' in request.GET:
        show_message = True
        msg_param = request.GET.get('msg_param')

    context = {
        'bc_param': bc_param,
        'years': years,
        'year_now': year_now,
        'show_message': show_message,
        'msg_param': msg_param
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

    }
    if delete == 'false':
        messages.success(request, 'You have successfully restore ' + bc_param + '!')
    elif safe == 'true':
        messages.success(request, 'You have successfully update ' + bc_param + '!')

    return render(request, 'staff_pages/degree_detail.html', context=context)





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
    year_now = date.today().year
    years = [year_now - 5, year_now - 4, year_now - 3, year_now - 2, year_now - 1, year_now, year_now + 1]
    context = {
        'bc_param': bc_param,
        'years': years,
        'year_now': year_now
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
    year_now = date.today().year
    years = [year_now - 5, year_now - 4, year_now - 3, year_now - 2, year_now - 1, year_now, year_now + 1]
    context = {
        'year_now': year_now,
        'years': years,
    }
    return render(request, 'staff_pages/major_add.html',context=context)


def minor(request):
    bc_param = 'Minor'
    year_now = date.today().year
    years = [year_now - 5, year_now - 4, year_now - 3, year_now - 2, year_now - 1, year_now, year_now + 1]
    context = {
        'bc_param': bc_param,
        'years': years,
        'year_now': year_now
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
    year_now = date.today().year
    years = [year_now - 5, year_now - 4, year_now - 3, year_now - 2, year_now - 1, year_now, year_now + 1]
    context = {
        'year_now': year_now,
        'years': years,
    }
    return render(request, 'staff_pages/minor_add.html',context=context)


def specialisation(request):
    bc_param = 'Specialisation'
    year_now = date.today().year
    years = [year_now - 5, year_now - 4, year_now - 3, year_now - 2, year_now - 1, year_now, year_now + 1]
    context = {
        'bc_param': bc_param,
        'years': years,
        'year_now': year_now
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
    year_now = date.today().year
    years = [year_now - 5, year_now - 4, year_now - 3, year_now - 2, year_now - 1, year_now, year_now + 1]
    context = {
        'year_now': year_now,
        'years': years,
    }
    return render(request, 'staff_pages/specialisation_add.html',context=context)


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
    code = request.POST.get('code')
    year = request.POST.get('year')
    name = request.POST.get('name')
    session = request.POST.get('session')
    units = request.POST.get('units')
    descriptions = request.POST.get('description').splitlines()
    prerequisites = request.POST.get('prerequisite').splitlines()
    outcomes = request.POST.get('outcome').splitlines()

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


def get_all_url(urlparrentens, prev, is_first=False, result=[]):
    if is_first:
        result.clear()
    for item in urlparrentens:
        v = item._regex.strip('^$')  # 去掉url中的^和$
        if isinstance(item, RegexURLPattern):
            result.append(prev + v)
        else:
            get_all_url(item.urlconf_name, prev + v)
    return result

def insert_db():
    # insert db function goes here
    return True
