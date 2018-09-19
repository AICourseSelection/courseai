from django.shortcuts import render
from .models import Feedback
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest, QueryDict

# Create your views here.


def give_feedback(request):

    try:
        feedback_str = request.GET['feedback']
        email = request.GET['email']
    except:
        res = JsonResponse({"response": "Error, please provide feedback"})
        return HttpResponseBadRequest(res)
    feedback = Feedback(text = feedback_str, email = email)
    feedback.save()

    return JsonResponse({"response": "success"})

def successView(request):
    return HttpResponse('Success! Thank you for your feedback.')