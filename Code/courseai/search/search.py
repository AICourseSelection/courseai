from builtins import NotImplementedError

from django.http import HttpResponse
from django.template import loader

from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search, Q
from elasticsearch_dsl.query import MultiMatch


def raw_search(search_object, phrase):
    q = MultiMatch(query=phrase, fields=['code^4', 'title^3', 'description', 'outcome^1.5'])
    response = search_object.query(q).execute()

    for hit in response['hits']['hits']:
        print(hit['_score'], hit['_source']['title'])

    course_list = [(hit['_source']['code'], hit['_source']['title']) for hit in response['hits']['hits']]

    return course_list


def __filtered_search(search_object, phrase, filter_string):
    q = MultiMatch(query=phrase, fields=['code^4', 'title^3', 'description^1.5', 'outcome'])
    q2 = Q('bool',
           should=[Q('match_phrase', title=filter_string),
                   Q('match_phrase', code=filter_string),
                   Q('match_phrase', description=filter_string),
                   Q('match_phrase', outcome=filter_string)],
           minimum_should_match=1
           )

    response = search_object.query(q).query(q2).execute()

    for hit in response['hits']['hits']:
        print(hit['_score'], hit['_source']['title'])

    course_list = [(hit['_source']['code'], hit['_source']['title']) for hit in response['hits']['hits']]

    return course_list


def course_search(search_object, phrase):
    # this search object should use the index called degrees
    q = Q('regexp', name=phrase + "*")
    response = search_object.query(q).execute()

    degree_list = [(hit['_source']['name'] for hit in response['hits']['hits'])]

    return degree_list


# need a way to run initiate Elastic instance only once

def execute_search(phrase, request):
    client = Elasticsearch()
    s = Search(using=client, index='courses')

    template = loader.get_template('dynamic_pages/search_results.html')

    response = None

    if '\"' in phrase:
        c = '\"'

        quote_positions = [pos for pos, char in enumerate(phrase) if char == c][:2]
        if len(quote_positions) < 2 or quote_positions[1] - quote_positions[0] < 2:
            response = raw_search(s, phrase)

        else:
            f_string = phrase[quote_positions[0] + 1: quote_positions[1]]
            response = __filtered_search(s, phrase, f_string)

    else:
        response = raw_search(s, phrase)

    context = {
        'query': phrase,
        'response': response
    }
    return HttpResponse(template.render(context, request))
