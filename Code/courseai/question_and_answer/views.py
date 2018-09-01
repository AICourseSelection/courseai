from django.shortcuts import render
from django.http import JsonResponse
# Create your views here.
import json
import os
from .helper import answer_q

def answer_question(request):
    question = request.GET['q']
    to_return = JsonResponse(json.loads(answer_q(question)))
    return to_return