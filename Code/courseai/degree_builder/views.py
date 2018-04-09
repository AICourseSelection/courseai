from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.views import generic
from django.views.generic import View
from django.template import loader
from django.http import HttpResponse
from .forms import UserForm
from .models import Student


# Create your views here.


def index(request):
    # if reached here from home page
    if 'uname' in request.POST and 'year' not in request.POST:
        username = request.POST['uname']
        template = loader.get_template('dynamic_pages/degree_builder.html')

        # if there is no existing entry in the database, add the person to the database and redirect them to the degree page
        try:
            student = Student.objects.filter(name=username).get()

            context = {
                'username': username,
                'start_year': student.start_year,
                'start_semester': student.start_semester,
                'interests': student.interests,
                'degree': student.degree
            }

        except Student.DoesNotExist:

            Student.objects.create(name=username)

            context = {
                'username': username,
                'start_year': "",
                'start_semester': "",
                'interests': "",
                'degree': ""
            }

        return HttpResponse(template.render(context, request))

    if 'uname' in request.POST and 'year' in request.POST:
        # save data in database
        username = request.POST['uname']
        template = loader.get_template('dynamic_pages/degree_builder.html')

        start_year = request.POST['year']
        start_semester = request.POST['semester']
        interests = request.POST['interests']
        degree = request.POST['degree']

        Student.objects.filter(name=username).update(start_year=start_year, start_semester=start_semester, interests=interests, degree=degree)

        context = {
            'username': username,
            'start_year': start_year,
            'start_semester': start_semester,
            'interests': interests,
            'degree': degree
        }

        print("reached here")
        print(Student.objects.all())

        return HttpResponse(template.render(context, request))

    raise NotImplementedError("Page seems to have been refreshed")


def get_degree(request):
    raise NotImplementedError("Get degree not implemented")


def update_degree(request):
    raise NotImplementedError("Update degree not implemented")
