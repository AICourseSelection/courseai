from django.template import loader

from . import search

import json
from django.http import JsonResponse, HttpResponse


def index(request):
    if 'query' not in request.GET:
        template = loader.get_template('static_pages/search.html')
        return HttpResponse(template.render({}, request))

    original_query = request.GET['query']
    filters = request.GET.get('filters', None)
    codes = None
    levels = None
    semesters = None

    if filters is not None:
        filters = json.loads(filters)
        print(filters)

        if 'codes' in filters and filters['codes']:
            codes = filters['codes']

        if 'levels' in filters and filters['levels']:
            levels = filters['levels']

        if 'semesters' in filters and filters['semesters']:
            semesters = filters['semesters']

    return search.execute_search(original_query, request, codes=codes, levels=levels, semesters_offered=semesters)
