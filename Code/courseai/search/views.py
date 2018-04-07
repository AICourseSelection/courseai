from builtins import NotImplementedError

from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse

def search_response(search_query):
    """
    Get the search response for a search query
    :param search_query: search query string
    :return: search response
    """
    raise NotImplementedError("Search is not implemented.")

def index(request,query):
    return HttpResponse(search_response(query))


