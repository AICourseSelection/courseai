from builtins import NotImplementedError

from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader


from . import search


def search_response(search_query, request):
    """
    Get the search response for a search query
    :param search_query: search query string
    :return: search response
    """
    return search.execute_search(search_query, request)


def index(request):
    if 'query' not in request.GET:
        template = loader.get_template('static_pages/search.html')
        return HttpResponse(template.render({}, request))

    original_query = request.GET['query']

    if original_query.isspace():
        raise NotImplementedError("Empty strings not handled yet")
    return search.execute_search(original_query, request)


