import os
from unidecode import unidecode
import requests
import json
from bs4 import BeautifulSoup

os.popen('export GOOGLE_APPLICATION_CREDENTIALS="/Users/Tom/.config/gcloud/key2.json"')

TOKEN = "Bearer "+ os.popen('~/downloads/google-cloud-sdk/bin/gcloud auth print-access-token').read().strip()
print(TOKEN)
BASE_ID = "OTM2NzIwNTc0OTk1MzkyMTAyNA"


def answer_q(q):
    q = q.replace(" ", "+")
    main_page = requests.get("https://www.google.com/search?q=" + q + "+site:programsandcourses.anu.edu.au")

    soup = BeautifulSoup(main_page.content, 'html.parser')
    main_page = requests.get(
        'http' + soup.find('h3', class_='r').find('a').get('href').split('http')[1].split('&sa')[0])
    soup = BeautifulSoup(main_page.content, 'html.parser')
    doc = ""
    for para in soup.find_all('p'):
        doc += "\n" + unidecode(para.text)

    doc = doc.replace("\"", "")
    doc_id = add_to_knowledge_base(doc, BASE_ID)
    return match_intent(q)
    #delete_from_knowledge_base(base_id, doc_id)


# add the document to the knowledge base
def add_to_knowledge_base(doc, base):
    url = 'https://dialogflow.googleapis.com/v2beta1/projects/anu-tier-1/knowledgeBases/' + base + '/documents'
    payload = """{
              "name":"",
              "displayName": "testing doc 2",
              "mimeType": "text/html",
              "knowledgeTypes": [
                "EXTRACTIVE_QA"
              ],

              "content": \"""" + doc + """\",
            }"""
    headers = {
        'Authorization': TOKEN
    }

    res = requests.post(url, data=payload, headers=headers).text
    print(res)
    try:
        return json.loads(res)["name"].split("-")[4]
    except:
        return None


def delete_from_knowledge_base(base, doc_id):
    url = 'https://dialogflow.googleapis.com/v2beta1/projects/anu-tier-1/agent/knowledgeBases/' + base + '/documents/' + doc_id
    payload = """{
              "name":\"""" + doc_id + """\",
              }"""
    headers = {
        'Authorization': TOKEN
    }
    print(requests.delete(url, data=payload, headers=headers).text)


def match_intent(s):
    s = "\""+s+"\""
    url = 'https://dialogflow.googleapis.com/v2beta1/projects/anu-tier-1/agent/sessions/ddfab5c3-64bd-a138-1e5e-894614e7d7bb:detectIntent'
    payload = """{
        "queryInput":{
            "text":{
                "text":%s,
                "languageCode":"en"
                }
            },
        "queryParams":{
            "timeZone":"Australia/Sydney"
        }
    }""" % s
    headers = {
               'Authorization': TOKEN
        }

    return requests.post(url, data=payload, headers=headers).text