from django.http import JsonResponse
from django.shortcuts import render
from django.template import loader

import csv


def all_degrees():
    return_data = {}
    results = []
    with open('data/degree-info.csv') as degree_info:
        degrees = csv.reader(degree_info, delimiter=';')
        for row in degrees:
            code = row[0]
            name = row[1]
            results.append((code, name))
    return_data['response'] = results
    return JsonResponse(return_data)




