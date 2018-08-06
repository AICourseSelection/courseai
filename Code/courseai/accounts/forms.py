from django import forms
from django.contrib.auth import (
    authenticate,
    get_user_model,
    login,
    logout
)

User = get_user_model() # needed for user registration

class UserLoginForm(forms.Form):
    email = forms.CharField()
    password = forms.CharField(widget=forms.PasswordInput)    # hidden passwords are not stored in plain text

    # when form is doing validation, "form.is_valid()",
    # check email, password, whether user is registered, whether user is active.
    def clean(self, *args, **kwargs):
        email = self.cleaned_data.get("email")
        password = self.cleaned_data.get("password")
        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise forms.ValidationError("This user does not exist.")
            if not user.is_active:
                raise forms.ValidationError("This user is not active.")
            if not user.check_password(password):
                raise forms.ValidationError("This password is incorrect.")
        return super(UserLoginForm, self).clean(*args, **kwargs)    # return default, not giving field error.


class UserRegisterForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput)
    email = forms.EmailField(label="Email adress")  # overide default email
    email2 = forms.EmailField(label="Confirm email")

    class Meta():    # information about class
        model = User
        fields = [    # order matters
            'email',
            'email2',
            'password'
        ]

    def clean_email2(self):
        """ Same as 'clean' method but give field error. """
        email = self.cleaned_data.get("email")
        email2 = self.cleaned_data.get("confirm_email")
        if email != email2:
            raise forms.ValidationError("Emails must match")
        email_db = User.objects.filter(email = email)
        if email_db.exists():
            raise forms.ValidationError("This email has already been registered")
        return email




















