from django.shortcuts import render

# Create your views here.

def index(request):
    original_query = request.GET['query']
    if original_query.isspace():
        raise NotImplementedError("Empty strings not handled yet")
    return search.execute_search(original_query, request)

