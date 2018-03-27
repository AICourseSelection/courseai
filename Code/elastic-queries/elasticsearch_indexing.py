import pandas as pd
import re

d=pd.read_csv("course_descriptions_all.csv", encoding='latin-1')

count_index = 256
courses = set()

for index, row in d.iterrows():
    if 'BUSN' in str(row[1]):
        code =str(row[1])
        title = str(row[2])
        desc = str(row[3])
        lo = str(row[4])
        
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
        
        desc = desc.replace("åÊ", '')
        lo = lo.replace("åÊ", '')
        desc = bytes(desc, 'utf-8').decode('utf-8', 'ignore')
        lo = bytes(lo, 'utf-8').decode('utf-8', 'ignore')

        code = code.replace('\\', '')
        title = title.replace('\\', '')
        desc = desc.replace('\\', '')
        lo = lo.replace('\\', '')
        desc = desc.replace('\t', ' ')
        lo = lo.replace('\t', ' ')
        
        regex = "^[A-Za-z0-9 ]*[A-Za-z0-9][A-Za-z0-9 ]*"
        re.match(regex, desc)
        re.match(regex, lo)
#         desc.match(re).join('')  
#         lo.match(re).join('')  

        
        # form the JSON
        print("PUT courses/_doc/" + str(count_index))
        count_index += 1
        print("{ \"code\":\"" + code +"\", \"title\":\"" + title + "\", \"description\": \"" + desc + "\", \"outcome\": \"" + lo + "\" }")
