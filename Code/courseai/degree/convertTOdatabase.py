import os
import json
rootpath = "D:\pycharm project\Code\courseai\static\json" #文件夹目录

def readJsonDir(rootpath):
    list = os.listdir(rootpath)
    for i in range(0, len(list)):
        path = os.path.join(rootpath, list[i])
        if os.path.isfile(path):
            readJsonOutside(path)
        else:
            readfile(path)

def readfile(filepath):
    list = os.listdir(filepath)
    for i in range(0, len(list)):
        path = os.path.join(filepath, list[i])
        if os.path.isfile(path):
            readJsonInsideside(path)

def readJsonInsideside(filePath):
    if filePath.find(".json") == -1:
        return
    with open(filePath, "r+", encoding='utf-8') as one_file:
        try:
            f=json.load(one_file)
            print("inside",f)
        finally:
            return

def readJsonOutside(filePath):
    if filePath.find(".json") == -1:
        return
    if filePath.find(".study_options"):
        with open(filePath, "r+", encoding='utf-8') as one_file:
            try:
                f=json.load(one_file)
                print("outside",f)
            finally:
                return

def main():
    print("main begin...")
    readJsonDir(rootpath)

if __name__ == '__main__':
    main()

