from django.http import JsonResponse

from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search, Q
from elasticsearch_dsl.query import MultiMatch


def code_filter(areas):
    """
    :param areas: The course areas to search by (eg. ["COMP", "MATH"])
    :return: A query object that searches at least one of the areas
    :raise: AssertionError if areas is None
    """

    if areas is None:
        raise AssertionError("Argument to areas must not be None")

    area_filters = []

    for area in areas:
        area_filters.append(Q('match', area=area))

    return Q('bool', should=area_filters, minimum_should_match=1)


def level_filter(levels):
    if levels is None:
        raise AssertionError("Argument to areas must not be None")

    if len(levels) == 1:  # Add an extra level filter to avoid a bug which comes up
        levels.append("9000")  # when there is exactly 1 level filter and 1 code filter

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
            return []

    elif codes is None and levels is not None:
        q3 = level_filter(levels)
        response = search_object.query(q).query(q3)
        count = response.count()
        response = response[0:count].execute()

    elif codes is not None and levels is None:
        q3 = level_filter(["1000", "2000", "3000", "4000"])
        q2 = code_filter(codes)
        response = search_object.query(q).query(q2).query(q3)
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

    should = []
    for word in phrase.split(" "):
        should.append(
            MultiMatch(query=word, type="phrase_prefix", fields=['code^4', 'title^3', 'description^1.5', 'outcome']))
    q = Q('bool', should=should, minimum_should_match=1)

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
