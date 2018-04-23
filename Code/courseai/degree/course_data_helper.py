from builtins import str, list, eval
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search, Q
from elasticsearch_dsl.query import MultiMatch

def get_data(code):
    q = MultiMatch(query=code, fields=['code^4'])
    client = Elasticsearch()
    s = Search(using=client, index='courses')
    response = s.query(q).execute()
    print(response['hits'])

    course_list = [{"course_code":hit['_source']['code'],
                    "title": hit['_source']['title'],
                    "description":hit['_source']['description'],
                    "learning_outcomes":hit['_source']['outcome'],
                    "prerequisite_text":hit['_source']['prereq_text'],
                    "prerequisites": eval(str(hit['_source']['pre_req_cnf']))
    } for hit in response['hits']['hits']][0]

    return course_list
