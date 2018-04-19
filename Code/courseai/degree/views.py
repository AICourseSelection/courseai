from django.http import JsonResponse
from django.shortcuts import render
from django.template import loader
from .models import Degree

from . import initialiser

DATABASE_INITIALISED = False


def initialise_database():
    global DATABASE_INITIALISED
    initialiser.fill_degree_table()
    DATABASE_INITIALISED = True


def all_degrees():
    if not DATABASE_INITIALISED:
        initialise_database()

    degree_list = Degree.objects.all()
    results = []

    for degree in degree_list:
        results.append({"code": degree.code, "name": degree.name})

    return JsonResponse({"response": results})




