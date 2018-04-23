import pandas as pd
import re

d=pd.read_csv("course_table_prereqs_cnf.csv", encoding='latin-1')

count_index = 1
courses = set()

for index, row in d.iterrows():
    if True:
        code =str(row[2])
        title = str(row[3])
        desc = str(row[4])
        lo = str(row[5])
        prereq_plaintext = str(row[6])
        prereq_cnf = row[7]
        
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
        desc = desc.replace('\t', ' ')
        lo = lo.replace('\t', ' ')
        desc = desc.replace('\n', ' ')
        lo = lo.replace('\n', ' ')
        desc = desc.replace('{', ' ')
        lo = lo.replace('{', ' ')
        desc = desc.replace('}', ' ')
        lo = lo.replace('}', ' ')
        area = code[:4]
        
        prereq_plaintext = ' '.join(prereq_plaintext.split())
        prereq_cnf = prereq_cnf.replace("'", '"')
        
        regex = "^[A-Za-z0-9 ]*[A-Za-z0-9][A-Za-z0-9 ]*"
        re.match(regex, desc)
        re.match(regex, lo)
        
        # form the JSON
        print("{ \"index\" : { \"_index\": \"courses\", \"_type\": \"_doc\" ,\"_id\": \"" + str(count_index) +"\"}}")
        count_index += 1
    print("{ \"code\":\"" + code +"\", \"title\":\"" + title + "\", \"description\": \"" + desc + "\", \"outcome\": \"" + lo + "\", \"area\": \"" + area + "\", \"prereq_text\": \"" + prereq_plaintext + "\", \"pre_req_cnf\":" + prereq_cnf + "}")
