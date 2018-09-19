# https://docs.djangoproject.com/en/1.10/ref/forms/api/

from django.forms import ModelForm
from .models import Feedback

# Unused
class FeedbackForm(ModelForm):

    class Meta:
        model = Feedback
        fields = "__all__"
		
# Form used for feedback		
class ContactForm(forms.Form):
    email = forms.EmailField(required=False)
    name = forms.CharField(required=False)
    comments = forms.CharField(widget=forms.Textarea, required=True)
	
	# Used to relabel
	def __init__(self, *args, **kwargs):
        super(ContactForm, self).__init__(*args, **kwargs)
        self.fields['name'].label = "Your Name:"
        self.fields['email'].label = "Your Email:"
        self.fields['comments'].label =
            "Your Message For Us:"