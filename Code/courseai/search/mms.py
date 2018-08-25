from django.http import JsonResponse

from elasticsearch_dsl import Search, Q
from elasticsearch_dsl.query import MultiMatch


def get_mms_data(es_conn, code):
    if len(code) <= 5:
        return JsonResponse({"error": "Input length insufficient"})

    if code[-4:] in ["-MAJ", "-MIN"]:
        return get_data(es_conn, code[-3:], code[:-4])
    else:  # -SPEC or -HSPC
        return get_data(es_conn, code[-4:], code[:-5])

    return JsonResponse({"error": "code must end with -MAJ, -MIN or -SPEC"})


INDEX_NAMES = {
        "MAJ": "majors", 
        "MIN": "minors", 
        "SPEC": "specialisations",
        "HSPC": "specialisations"
}

def get_data(es_conn, index, code):
    response = Search(using=es_conn, index=INDEX_NAMES[index]).query("match",
            code=code).execute().to_dict()  # the to_dict() works like magic

    responses = response['hits']['hits']
    if not responses:
        return JsonResponse({})

    return JsonResponse(responses[0]['_source'])


def search_all(es_conn, index):
    responses = Search(using=es_conn, index=INDEX_NAMES[index]).query("match", code=index)
    count = responses.count()
    result = responses[0:count].execute().to_dict()
    res = {'response': result['hits']['hits']}
    return JsonResponse(res)


def mms_by_name(es_conn, name, index_name):
    should = []
    for word in name.split(" "):
        should.append(MultiMatch(query=word, type="phrase_prefix", fields=['name']))
    q = Q('bool', should=should, minimum_should_match=1)
    response = Search(using=es_conn, index=index_name).query(q).execute().to_dict()  # the to_dict() works like magic

    responses = response['hits']['hits']

    responses = [r['_source'] for r in responses if '_source' in r]

    res = {'responses': responses}

    return JsonResponse(res)


def course_lists(es_conn, query):
    response = Search(using=es_conn, index='courselists').query("match", type=query).execute().to_dict()
    responses = response['hits']['hits']
    responses = [r['_source'] for r in responses if '_source' in r]
    if len(responses) > 1:
        response = responses[0]
    else:
        response = responses
    res = {'response': response}
    return JsonResponse(res)
