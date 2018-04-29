import json
from django.http import JsonResponse
from django.template import loader

from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search, Q
from elasticsearch_dsl.query import MultiMatch


# returns Q object
# areas should not be None
def code_filter(areas):
    if areas is None:
        raise AssertionError("Argument to areas must not be None")

    area_filters = []

    for area in areas:
        area_filters.append(Q('match', area=area))

    return Q('bool', should=area_filters, minimum_should_match=1)


def level_filter(levels):
    if levels is None:
        raise AssertionError("Argument to areas must not be None")

    level_filters = []

    for level in levels:
        level_filters.append(Q('match', level=level))

    return Q('bool', should=level_filters, minimum_should_match=1)


def raw_search(search_object, phrase, codes, levels):
    q = MultiMatch(query=phrase, fields=['code^4', 'title^3', 'description', 'outcome^1.5'])

    # if areas is not None:
    #     q3 = area_filter(areas)
    #     response = search_object.query(q).query(q3).execute()
    # else:
    #     response = search_object.query(q).execute()

    if codes is None and levels is None:
        response = search_object.query(q).execute()

    elif codes is None and levels is not None:
        q3 = level_filter(levels)
        response = search_object.query(q).query(q3).execute()

    elif codes is not None and levels is None:
        q2 = code_filter(codes)
        response = search_object.query(q).query(q2).execute()

    else:  # both are not none
        q2 = code_filter(codes)
        q3 = level_filter(levels)
        response = search_object.query(q).query(q2).query(q3).execute()

    for hit in response['hits']['hits']:
        print(hit['_score'], hit['_source']['title'])

    course_list = []
    for hit in response['hits']['hits']:
        course = {'code': hit['_source']['code'], 'title': hit['_source']['title']}
        course_list.append(course)
    return course_list


def __filtered_search(search_object, phrase, filter_string, codes, levels):
    q = MultiMatch(query=phrase, fields=['code^4', 'title^3', 'description^1.5', 'outcome'])
    q2 = Q('bool',
           should=[Q('match_phrase', title=filter_string),
                   Q('match_phrase', code=filter_string),
                   Q('match_phrase', description=filter_string),
                   Q('match_phrase', outcome=filter_string)],
           minimum_should_match=1
           )

    if codes is not None:
        q3 = code_filter(codes)
        response = search_object.query(q).query(q2).query(q3).execute()
    else:
        response = search_object.query(q).query(q2).execute()

    for hit in response['hits']['hits']:
        print(hit['_score'], hit['_source']['title'])

    course_list = []
    for hit in response['hits']['hits']:
        course = {'code': hit['_source']['code'], 'title': hit['_source']['title']}
        course_list.append(course)

    return course_list


def course_search(search_object, phrase):
    # this search object should use the index called degrees
    q = Q('regexp', name="*" + phrase + "*")
    response = search_object.query(q).execute()

    degree_list = [(hit['_source']['name'] for hit in response['hits']['hits'])]

    return degree_list


# need a way to run initiate Elastic instance only once

def execute_search(phrase, request, codes, levels):
    client = Elasticsearch()
    s = Search(using=client, index='courses')

    if '\"' in phrase:
        c = '\"'

        quote_positions = [pos for pos, char in enumerate(phrase) if char == c][:2]
        if len(quote_positions) < 2 or quote_positions[1] - quote_positions[0] < 2:
            response = raw_search(s, phrase, codes, levels)

        else:
            f_string = phrase[quote_positions[0] + 1: quote_positions[1]]
            response = __filtered_search(s, phrase, f_string, codes, levels)

    else:
        response = raw_search(s, phrase, codes, levels)

    resp = {'query': phrase, 'response': response}
    print(resp)
    return JsonResponse(resp)
