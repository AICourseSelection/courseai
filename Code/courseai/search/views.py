from builtins import NotImplementedError, Exception

from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader


from . import search


def index(request):
    if 'query' not in request.GET:
        template = loader.get_template('static_pages/search.html')
        return HttpResponse(template.render({}, request))

    original_query = request.GET['query']
    areas = request.GET.get('subject_area', None)

    return search.execute_search(original_query, request, areas=areas)

