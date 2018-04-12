import pandas as pd
import re

d=pd.read_csv("course_descriptions_with_prereq.csv", encoding='latin-1')

count_index = 1
courses = set()

for index, row in d.iterrows():
    if True:
        code =str(row[1])
        title = str(row[2])
        desc = str(row[3])
        lo = str(row[4])
        
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
        desc = desc.replace('\', '')
        lo = lo.replace('\', '')
        desc = bytes(desc, 'utf-8').decode('utf-8', 'ignore')
        lo = bytes(lo, 'utf-8').decode('utf-8', 'ignore')

        code = code.replace('\\', ' ')
        title = title.replace('\\', ' ')
        desc = desc.replace('\\', ' ')
        lo = lo.replace('\\', ' ')
        desc = desc.replace('\t', ' ')
        lo = lo.replace('\t', ' ')
        desc = desc.replace('\n', ' ')
        lo = lo.replace('\n', ' ')
        desc = desc.replace('{', ' ')
        lo = lo.replace('{', ' ')
        desc = desc.replace('}', ' ')
        lo = lo.replace('}', ' ')
        
        regex = "^[A-Za-z0-9 ]*[A-Za-z0-9][A-Za-z0-9 ]*"
        re.match(regex, desc)
        re.match(regex, lo)
        
        # form the JSON
        print("{ \"index\" : { \"_index\": \"courses\", \"_type\": \"_doc\" ,\"_id\": \"" + str(count_index) +"\"}}")
        count_index += 1
        print("{ \"code\":\"" + code +"\", \"title\":\"" + title + "\", \"description\": \"" + desc + "\", \"outcome\": \"" + lo + "\" }")
       
