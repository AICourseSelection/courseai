from builtins import NotImplementedError, Exception

from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader

from . import search

import json


def index(request):
    if 'query' not in request.GET:
        template = loader.get_template('static_pages/search.html')
        return HttpResponse(template.render({}, request))

    original_query = request.GET['query']
    filters = request.GET.get('filters', None)
    codes = None
    levels = None

    if filters is not None:
        filters = json.loads(filters)

        if 'codes' in filters:
            codes = filters['codes']

        if 'levels' in filters:
            levels = filters['levels']


    return search.execute_search(original_query, request, codes=codes, levels=levels)

