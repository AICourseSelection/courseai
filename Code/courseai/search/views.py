from django.template import loader

from . import mms, search

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

        if 'codes' in filters and filters['codes']:
            codes = filters['codes']

        if 'levels' in filters and filters['levels']:
            levels = filters['levels']

        if 'semesters' in filters and filters['semesters']:
            semesters = filters['semesters']

    return search.execute_search(original_query, request, codes=codes, levels=levels, semesters_offered=semesters)


def mms_request(request):
    try:
        code = request.GET['query']
        return mms.get_mms_data(code)
    except:
        raise Exception("Malformed JSON as input. Expects a field called query.")


def all_majors(request):
    try:
        name = request.GET['query']
        return mms.mms_by_name(name, 'majors')
    except:
        return mms.all_majors()


def all_minors(request):
    try:
        name = request.GET['query']
        return mms.mms_by_name(name, 'minors')
    except:
        return mms.all_minors()


def all_specs(request):
    try:
        name = request.GET['query']
        return mms.mms_by_name(name, 'specialisations')
    except:
        return mms.all_specs()


def course_lists(request):
    query = request.GET['query']
    return mms.course_lists(query)

