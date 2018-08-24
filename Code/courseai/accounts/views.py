from django.shortcuts import render, redirect
from .forms import UserLoginForm, UserRegisterForm
from django.contrib.auth.models import User
from django.contrib.auth import (
    authenticate,
    get_user_model,
    login,
    logout
)

# decorator function by Mathieu Marques - https://stackoverflow.com/questions/16569784/how-does-one-protect-his-ajax-views-with-django/18213333#18213333
def require_AJAX(function):
    """Return a bad request instance if the view is not using AJAX
    function -- the view
    """

    def wrap(request, *args, **kwargs):
        if not request.is_ajax():
            return HttpResponseBadRequest()
        return function(request, *args, **kwargs)

    wrap.__doc__ = function.__doc__
    wrap.__name__ = function.__name__
    return wrap

# create form for each aspects of these
#@csrf_protect
def login_view(request):
    title = "Login"
    form = UserLoginForm(request.POST or None)  # translating any false value (e.g. an empty list, empty dict) into None

    if form.is_valid():
        email = form.cleaned_data.get('email')    # get the email from form
        password = form.cleaned_data.get('password')

        user = authenticate(username=email, password=password)
        if user is not None:
            login(request, user)    # a login cycle
            print("login success")
            return redirect("/")
    return render(request, "dynamic_pages/index.html", {"form": form, "title": title})    #(request, template, context dictionary)

@require_AJAX
def register_view(request):
    title = "Register"
    form = UserRegisterForm(request.POST or None, request)

    # save new user to database
    if form.is_valid():
        user = form.save(commit=False)
        password = form.cleaned_data.get('password')
        user.set_password(password)
        user.save()

        login(request, user)
        return redirect("/")   
        
    context = {
        "form": form,
        "title": title
    }
    return render(request, "dynamic_pages/index.html", context)
       
#@csrf_protect
def logout_view(request):
    logout(request)
    return redirect("/")
