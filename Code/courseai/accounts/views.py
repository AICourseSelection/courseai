from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.decorators import login_required
from django.http import QueryDict
from django.shortcuts import render, redirect
from django.db import models
from accounts.admin import CustomUserAdmin
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest, QueryDict, HttpResponseRedirect
from .forms import UserLoginForm, UserRegisterForm
from django.contrib.auth.models import User
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_protect, csrf_exempt

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
@csrf_protect
@require_AJAX
def login_view(request):
    form = UserLoginForm(request.POST or None)  # translating any false value (e.g. an empty list, empty dict) into None

    if form.is_valid():
        email = form.cleaned_data.get('email')  # get the email from form
        password = form.cleaned_data.get('password')

        user = authenticate(username=email, password=password)
        if user is not None:
            if user.is_active:
                login(request, user)    # a login cycle
                return HttpResponse('OK')
            else: 
                return HttpResponse('InactiveAccountError')
            
    errMsg = { (v[0]) for _, v in form.errors.items() }
    errStr = '<br>'.join(msg for msg in errMsg)
    return HttpResponse(errStr);

@csrf_protect
@require_AJAX
def register_view(request):
    form = UserRegisterForm(request.POST or None, request)

    # save new user to database
    if form.is_valid():
        user = form.save(commit=False)
        password = form.cleaned_data.get('password')
        user.set_password(password)
        user.save()

        login(request, user)
        return HttpResponse('OK')
        
    errMsg = { (v[0]) for _, v in form.errors.items() }
    errStr = '<br>'.join(msg for msg in errMsg)
    return HttpResponse(errStr);

@csrf_exempt    # TODO: Add CSRF protection for logout? Necessary?
def logout_view(request):
    logout(request)
    return HttpResponseRedirect("{{index")

# @csrf_protect
def code_view(request):
    if request.method == "PUT" or request.method == "DELETE" or request.method == "GET":
        data = request.body.decode('utf-8')
        proc = QueryDict(data)
        email = proc['email']
        code = proc['code']

        a = User.objects.get(username=email)
        store_code = a.profile.degree_plan_code
        res_success = JsonResponse({"response": "success"})
        res_error = JsonResponse({"response": "error"})

        if request.method == "PUT":
            i = 0
            while i < len(store_code) - 5:
                if store_code[i: i + 10] == code:
                    return HttpResponse(res_success)
                i += 11
            store_code += "," + code
            a.profile.save()
            return HttpResponse(res_success)
        elif request.method == "DELETE":
            i = 0
            while i < len(store_code)-5:
                if store_code[i: i + 10] == code:
                    store_code.strip(store_code[i:i + 10])
                    a.profile.save()
                    return HttpResponse(res_success)
                i += 11
            return HttpResponse(res_success)
        elif request.method == "GET":
            return (store_code)
    return HttpResponse(res_error)

@login_required
def get_user_profile(request):
    user = None
    if not request.user is None:
        user = request.user
    return render(request, 'dynamic_pages/user_profile.html', {'user': user})

# def password_reset__request(request):
# def password_reset_confirm(request):
# def password_reset_complete(request):
# def password_reset_done(request):
