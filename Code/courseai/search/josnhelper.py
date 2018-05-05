import json


def parse_degree_json(json_obj):
    json_deg = json.loads(json_obj)
    if('courses' in json_deg):
        courses = json_deg['courses']
    else:
        courses = json_deg
    result = []
    for sem in courses:
        for s in sem:
            for course in sem[s]:
                if(course['code'] == "Elective Course"):
                    continue
                result.append(course['code'])
    return result


if __name__ == '__main__':
    print(parse_degree_json('{ "code": "AACRD", "courses": [ { "2015S1" : [ { "code": "COMP1130", "title": "Programming as Problem Solving" }, { "code": "COMP1130", "title": "Programming as Problem Solving" }, { "code": "COMP1130", "title": "Programming as Problem Solving" }, { "code": "Elective Course" } ] }, { "2015S2" : [ { "code": "COMP1130", "title": "Programming as Problem Solving" }, { "code": "COMP1130", "title": "Programming as Problem Solving" }, { "code": "COMP1130", "title": "Programming as Problem Solving" }, { "code": "Elective Course" } ] }, { "2016S1" : [ { "code": "COMP1130", "title": "Programming as Problem Solving" }, { "code": "COMP1130", "title": "Programming as Problem Solving" }, { "code": "COMP1130", "title": "Programming as Problem Solving" }, { "code": "COMP1130", "title": "Programming as Problem Solving" } ] }, { "2016S2" : [ { "code": "COMP1130", "title": "Programming as Problem Solving" }, { "code": "COMP1130", "title": "Programming as Problem Solving" }, { "code": "COMP1130", "title": "Programming as Problem Solving" }, { "code": "COMP1130", "title": "Programming as Problem Solving" } ] }, { "2017S1" : [ { "code": "COMP1130", "title": "Programming as Problem Solving" }, { "code": "COMP1130", "title": "Programming as Problem Solving" }, { "code": "COMP1130", "title": "Programming as Problem Solving" }, { "code": "COMP1130", "title": "Programming as Problem Solving" } ] }, { "2017" : [ { "code": "COMP1130", "title": "Programming as Problem Solving" }, { "code": "COMP1130", "title": "Programming as Problem Solving" }, { "code": "COMP1130", "title": "Programming as Problem Solving" }, { "code": "COMP1130", "title": "Programming as Problem Solving" } ] } ] }'))