from search import search
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search


def get_recommendations(interests, completed_courses):
    client = Elasticsearch()
    s = Search(using=client, index='courses')
    recommendations = []

    for interest in interests:
        course_list = search.raw_search(s, interest)
        for element in course_list:
            code = element[0]
            if code not in completed_courses:
                recommendations.append(code)
                break

    return recommendations
