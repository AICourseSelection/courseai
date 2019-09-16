import os
import json
<<<<<<< HEAD
#from .models import StudyOption
rootpath = "/Users/please/PycharmProjects/courseai/Code/courseai/static/json"

=======

rootpath = "/Users/please/PycharmProjects/courseai/Code/courseai/static/json"
>>>>>>> f285b0e3d6765c51f35b94bdc6a5c03e5dee99f4

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
            if i == 1:
                print("is 1")
                readJsonInsideside(path)



def readJsonInsideside(filePath):
    if filePath.find(".json") == -1:
        return
    with open(filePath, "r+", encoding='utf-8') as one_file:
        try:
<<<<<<< HEAD
            f = json.load(one_file)
            print("inside", f['code'])
            print("")
            #s = StudyOption()
            print("inside", f)
=======
            f=json.load(one_file)
            #add_to_db(f)
            print("inside",f)
>>>>>>> f285b0e3d6765c51f35b94bdc6a5c03e5dee99f4
        finally:
            return


def readJsonOutside(filePath):
    if filePath.find(".json") == -1:
        return
    if filePath.find(".study_options"):
        with open(filePath, "r+", encoding='utf-8') as one_file:
            try:
                f=json.load(one_file)
                #print("outside",f)
            finally:
                return

def main():
    print("main begin...")
    readJsonDir(rootpath)


if __name__ == '__main__':
    main()

