import json
import urllib
import urllib.request
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

    if len(levels) == 1:        # Add an extra level filter to avoid a bug which comes up
        levels.append("9000")   # when there is exactly 1 level filter and 1 code filter

    level_filters = []

    for level in levels:
        level_filters.append(Q('match', level=level))

    return Q('bool', should=level_filters, minimum_should_match=1)


def raw_search(search_object, phrase, codes, levels, sem_queried):
    should = []
    for word in phrase.split(" "):
        should.append(
            MultiMatch(query=word, type="phrase_prefix", fields=['code^4', 'title^3', 'description^1.5', 'outcome']))
    q = Q('bool', should=should, minimum_should_match=1)

    if codes is None and levels is None:
        response = search_object.query(q)
        count = response.count()

        if count > 0:
            response = response[0:count].execute()

        else:
            course_list = []
            search_phrase = phrase
            try:
                contents = urllib.request.urlopen(
                'http://localhost:7200/repositories/CourseAIOntology?query=PREFIX%20luc%3A%20%3Chttp%3A%2F%2Fwww.ontotext.com%2Fconnectors%2Flucene%23%3E%20PREFIX%20inst%3A%20%3Chttp%3A%2F%2Fwww.ontotext.com%2Fconnectors%2Flucene%2Finstance%23%3E%20PREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%20PREFIX%20%3A%20%3Chttp%3A%2F%2Fwww.ontotext.com%2Fconnectors%2Flucene%23%3E%20%20SELECT%20DISTINCT%20%3Fsubject%20%7B%20%20%20%3Fsearch%20a%20inst%3AcourseSearch%20%3B%20%20%20%20%20%20%20%20%20%20luc%3Aquery%20%22glossary%3A' + search_phrase + '%2C%20description%3A' + search_phrase + '%22%3B%20%20%20%20%20%20%20luc%3Aentities%20%3Fentity%20.%20%20%20%3Fentity%20rdfs%3Arelated_subject%20%3Fsubject%20%7D%20LIMIT%20100').read()
                contents = contents.decode('utf-8')
                code = contents.split('\n')[1]
                code = code.strip()
                title = raw_search(search_object, code, None, None, sem_queried=None)[0]['title']
                course_list.append({'code': code, 'title': title})
            except:
                return []
            return course_list



    elif codes is None and levels is not None:
        q3 = level_filter(levels)
        response = search_object.query(q).query(q3)
        count = response.count()
        response = response[0:count].execute()

    elif codes is not None and levels is None:
        q2 = code_filter(codes)
        response = search_object.query(q).query(q2)
        count = response.count()
        response = response[0:count].execute()

    else:  # both are not none
        q2 = code_filter(codes)
        q3 = level_filter(levels)
        response = search_object.query(q).query(q2).query(q3)
        count = response.count()
        response = response[0:count].execute()

    course_list = []
    for hit in response['hits']['hits']:

        # perform the semester filtering here
        try:
            sem_offered = hit['_source']['semester']
        except:
            continue
        if sem_queried is None:
            course = {'code': hit['_source']['code'], 'title': hit['_source']['title']}

        elif len(sem_queried) == 2 and len(sem_offered) != 0:
            course = {'code': hit['_source']['code'], 'title': hit['_source']['title']}

        elif len(sem_queried) == 1 and sem_queried[0] == 1 and (1 in sem_offered):
            course = {'code': hit['_source']['code'], 'title': hit['_source']['title']}

        elif len(sem_queried) == 1 and sem_queried[0] == 2 and (2 in sem_offered):
            course = {'code': hit['_source']['code'], 'title': hit['_source']['title']}

        else:
            continue

        course_list.append(course)
    return course_list


def __filtered_search(search_object, phrase, filter_string, codes, levels, sem_queried=None):

    q2 = Q('bool',
           should=[Q('match_phrase', title=filter_string),
                   Q('match_phrase', code=filter_string),
                   Q('match_phrase', description=filter_string),
                   Q('match_phrase', outcome=filter_string)],
           minimum_should_match=1
           )


    print("*****"+phrase)

    should =[]
    for word in phrase.split(" "):
        should.append(MultiMatch(query=word, type="phrase_prefix", fields=['code^4', 'title^3', 'description^1.5', 'outcome']))
    q = Q('bool', should = should, minimum_should_match=1)

    if codes is None and levels is None:
        response = search_object.query(q).query(q2)
        count = response.count()
        response = response[0:count].execute()

    elif codes is None and levels is not None:
        q3 = level_filter(levels)
        response = search_object.query(q).query(q2).query(q3)
        count = response.count()
        response = response[0:count].execute()

    elif codes is not None and levels is None:
        q4 = code_filter(codes)
        response = search_object.query(q).query(q2).query(q4)
        count = response.count()
        response = response[0:count].execute()

    else:  # both are not none
        q4 = code_filter(codes)
        q3 = level_filter(levels)
        response = search_object.query(q).query(q2).query(q3).query(q4)
        count = response.count()
        response = response[0:count].execute()

    for hit in response['hits']['hits']:
        print(hit['_score'], hit['_source']['title'])

    course_list = []
    for hit in response['hits']['hits']:
        # perform the semester filtering here
        sem_offered = hit['_source']['semester']
        if sem_queried is None:
            course = {'code': hit['_source']['code'], 'title': hit['_source']['title']}

        elif len(sem_queried) == 2 and len(sem_offered) != 0:
            course = {'code': hit['_source']['code'], 'title': hit['_source']['title']}

        elif len(sem_queried) == 1 and sem_queried[0] == 1 and (1 in sem_offered):
            course = {'code': hit['_source']['code'], 'title': hit['_source']['title']}

        elif len(sem_queried) == 1 and sem_queried[0] == 2 and (2 in sem_offered):
            course = {'code': hit['_source']['code'], 'title': hit['_source']['title']}

        else:
            continue
        course_list.append(course)

    return course_list


def course_search(search_object, phrase):
    # this search object should use the index called degrees
    q = Q('regexp', name="*" + phrase + "*")
    response = search_object.query(q).execute()

    degree_list = [(hit['_source']['name'] for hit in response['hits']['hits'])]

    return degree_list


# need a way to run initiate Elastic instance only once

def execute_search(phrase, request, codes, levels, semesters_offered=None):
    client = Elasticsearch()
    s = Search(using=client, index='courses')

    if '\"' in phrase:
        c = '\"'

        quote_positions = [pos for pos, char in enumerate(phrase) if char == c][:2]
        if len(quote_positions) < 2 or quote_positions[1] - quote_positions[0] < 2:
            response = raw_search(s, phrase, codes, levels, sem_queried=semesters_offered)

        else:
            f_string = phrase[quote_positions[0] + 1: quote_positions[1]]
            response = __filtered_search(s, phrase, f_string, codes, levels, sem_queried=semesters_offered)

    else:
        response = raw_search(s, phrase, codes, levels, sem_queried=semesters_offered)

    resp = {'query': phrase, 'response': response}
    return JsonResponse(resp)
