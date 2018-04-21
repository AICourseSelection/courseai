from .models import Degree

import csv


def fill_degree_table():
    with open('data/degree-info.csv') as degree_info:
        degrees = csv.reader(degree_info, delimiter=';')
        for row in degrees:
            code = row[0]
            name = row[1]
            requirements = "Not available"
            d = Degree(code=code, name=name, requirements=requirements)
            d.save()
