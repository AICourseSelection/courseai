import sqlite3
import json
import os
conn = sqlite3.connect('/Users/zhangrui/PycharmProjects/courseai/Code/courseai/db.sqlite3')
print("open successfully")
rootpath = "/Users/zhangrui/PycharmProjects/courseai/Code/courseai/static/json/study_options"

def readJsonDir(rootpath):
    list = os.listdir(rootpath)
    for i in range(0, len(list)):
        path = os.path.join(rootpath, list[i])
        if os.path.isfile(path):
            readJsonOutside(path)

def readJsonOutside(filePath):
    if filePath.find(".json") == -1:
        return

    with open(filePath, "r+", encoding='utf-8') as one_file:
        try:
            f = json.load(one_file)
            str1 = json.dumps(f)
            str2 = os.path.basename(filePath)
            str2 = str2.split('.')[0]
            sql = "insert into degree_inside(codeyear, content) values('%s', '%s')" % (str2, str1)
            conn.execute(sql)
            conn.commit()
        finally:
            return
def main():
    print("main begin...")
    readJsonDir(rootpath)

if __name__ == '__main__':
    main()