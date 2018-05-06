import pandas as pd
import re

d=pd.read_csv("course_descriptions.csv", encoding='latin-1')

count_index = 1
courses = set()

for index, row in d.iterrows():
    code =str(row[1])
    title = str(row[2])
    desc = str(row[3])
    lo = str(row[4])
    prereq_plaintext = str(row[6])

    prereq_cnf = str(row[5])
    semester = str(row[8])



    if len(code) != 8 or (not title.strip()) or (not desc.strip()) or (not lo.strip()):
        continue

    if not '1' <= code[4] <= '9':
        continue

    if int(code[4]) > 4:
        continue

    if code in courses:
        continue


    courses.add(code)

    # sanitize the strings
    code = code.replace('"', '')
    title = title.replace('"', '')
    desc = desc.replace('"', '')
    lo = lo.replace('"', '')

    desc = desc.replace("åÊ", ' ')
    lo = lo.replace("åÊ", ' ')
    desc = bytes(desc, 'utf-8').decode('utf-8', 'ignore')
    lo = bytes(lo, 'utf-8').decode('utf-8', 'ignore')

    code = code.replace('\\', ' ')
    title = title.replace('\\', ' ')
    desc = desc.replace('\\', ' ')
    lo = lo.replace('\\', ' ')
    lo = ' '.join(lo.split())
    desc = ' '.join(desc.split())
    desc = desc.replace('{', ' ')
    lo = lo.replace('{', ' ')
    desc = desc.replace('}', ' ')
    lo = lo.replace('}', ' ')
    area = code[:4]


    level = str(int(code[4])*1000)

    prereq_plaintext = ' '.join(prereq_plaintext.split())
    prereq_cnf = prereq_cnf.replace("'", '"')

    

    regex = "^[A-Za-z0-9 ]*[A-Za-z0-9][A-Za-z0-9 ]*"
    re.match(regex, desc)
    re.match(regex, lo)

    # form the JSON
    count_index += 1
    print("{ \"index\" : { \"_index\": \"courses\", \"_type\": \"_doc\" ,\"_id\": \"" + str(count_index) +"\"}}")
    print("{ \"code\":\"" + code +"\", \"title\":\"" + title + "\", \"description\": \"" + desc + "\", \"outcome\": \"" + lo + "\", \"area\": \"" + area + "\", \"level\": \"" + level + "\", \"prereq_text\": \"" + prereq_plaintext + "\", \"semester\":"  + semester + ", \"pre_req_cnf\":" + prereq_cnf + "}")
