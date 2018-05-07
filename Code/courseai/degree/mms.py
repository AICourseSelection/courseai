import json

from django.http import JsonResponse

from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search, Q
from elasticsearch_dsl.query import MultiMatch


def get_mms_data(code):
    if len(code) <= 5:
        return JsonResponse({"error": "Input length insufficient"})

    if code[-4:] == "-MAJ":
        return get_major_data(code[:-4])

    if code[-4:] == "-MIN":
        return get_minor_data(code[:-4])

    if code[-5:] in ["-SPEC", "-HSPC"]:
        return get_spec_data(code[:-5])

    return JsonResponse({"error": "code must end with -MAJ, -MIN or -SPEC"})


def get_major_data(code):
    client = Elasticsearch()
    response = Search(using=client, index='majors').query("match",
                                                          code=code).execute().to_dict()  # the to_dict() works like magic

    responses = response['hits']['hits']
    if not responses:
        return JsonResponse({})

    res = responses[0]['_source']

    return JsonResponse(res)


def get_minor_data(code):
    client = Elasticsearch()
    response = Search(using=client, index='minors').query("match",
                                                          code=code).execute().to_dict()  # the to_dict() works like magic

    responses = response['hits']['hits']
    if not responses:
        return JsonResponse({})

    res = responses[0]['_source']

    return JsonResponse(res)


def get_spec_data(code):
    client = Elasticsearch()
    response = Search(using=client, index='specialisations').query("match",
                                                                   code=code).execute().to_dict()  # the to_dict() works like magic

    responses = response['hits']['hits']
    if not responses:
        return JsonResponse({})

    res = responses[0]['_source']

    return JsonResponse(res)


def all_majors():
    client = Elasticsearch()
    responses = Search(using=client, index='majors').query("match", code="MAJ")
    count = responses.count()
    result = responses[0:count].execute().to_dict()
    res = {'response': result['hits']['hits']}
    return JsonResponse(res)


def all_minors():
    client = Elasticsearch()
    responses = Search(using=client, index='minors').query("match", code="MIN")
    count = responses.count()
    result = responses[0:count].execute().to_dict()
    res = {'response': result['hits']['hits']}
    return JsonResponse(res)


def all_specs():
    client = Elasticsearch()
    responses = Search(using=client, index='specialisations').query("match", code="SPEC")
    count = responses.count()
    result = responses[0:count].execute().to_dict()
    res = {'response': result['hits']['hits']}
    return JsonResponse(res)


def mms_by_name(name, index_name):
    client = Elasticsearch()
    q = MultiMatch(query=name, type="phrase_prefix", fields=['name'])
    response = Search(using=client, index=index_name).query(q).execute().to_dict()  # the to_dict() works like magic

    responses = response['hits']['hits']

    responses = [r['_source'] for r in responses if '_source' in r]

    res = {'responses': responses}

    return JsonResponse(res)


def course_lists(query):
    client = Elasticsearch()
    response = Search(using=client, index='courselists').query("match", type=query).execute().to_dict()
    responses = response['hits']['hits']
    responses = [r['_source'] for r in responses if '_source' in r]
    if len(responses) > 1:
        response = responses[0]
    else:
        response = responses
    res = {'response': response}
    return JsonResponse(res)
