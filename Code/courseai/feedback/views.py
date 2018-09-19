from django.shortcuts import render
from .models import Feedback
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest, QueryDict
from .forms import FeedbackForm

# Create your views here.

# Yong Wei + Tom's give_feedback - 
def feedbackView(request):
    if request.method == 'GET':
	# if GET we create a blank feedback form
        form = FeedbackForm()
    else:
        form = FeedbackForm(request.POST)
        if form.is_valid():
            name = form.cleaned_data['name']
            email = form.cleaned_data['email']
            comments = form.cleaned_data['comments']
			
			template =
				get_template('feedback_template.txt')
			context = {
				'Your Name': name,
				'Your Email': email,
				'Your Message': comments,
			}
			content = template.render(context)
			
            try:
				feedback_str = request.GET['feedback']
				email = request.GET['email']
			except:
				res = JsonResponse({"response": "Error, please provide feedback"})
				return HttpResponseBadRequest(res)
			feedback = Feedback(text = feedback_str, email = email)
			feedback.save()

			return JsonResponse({"response": "success"})
    return render(request, 'feedback.html', {'form': form})

# Tom
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