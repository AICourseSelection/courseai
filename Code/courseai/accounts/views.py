from django.contrib.auth.admin import UserAdmin
from django.http import QueryDict
from django.shortcuts import render, redirect
from django.db import models
from accounts.admin import CustomUserAdmin
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest, QueryDict
from .forms import UserLoginForm, UserRegisterForm
from django.contrib.auth.models import User
from django.contrib.auth import (
    authenticate,
    get_user_model,
    login,
    logout
)

# create form for each aspects of these
#@csrf_protect
def login_view(request):
    title = "Login"
    form = UserLoginForm(request.POST or None)  # translating any false value (e.g. an empty list, empty dict) into None

    if form.is_valid():
        email = form.cleaned_data.get('email')  # get the email from form
        password = form.cleaned_data.get('password')

        user = authenticate(username=email, password=password)
        if user is not None:
            login(request, user)    # a login cycle
            return redirect("/")
    return render(request, "dynamic_pages/index.html", {"form": form, "title": title})    #(request, template, context dictionary)

#@csrf_protect
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
    return redirect("/")
    #context = {
    #    "register_form": form,
    #    "title": title
    #}
    #return render(request, "dynamic_pages/index.html", context)

#@csrf_protect
def logout_view(request):
    logout(request)
    return redirect("/")


def code_view(request):
    if request.method == "PUT" or request.method == "DELETE":
        data = request.body.decode('utf-8')
        proc = QueryDict(data)
        email = proc['email']
        code = proc['code']

        a = User.objects.get(username=email)

        if request.method == "PUT":
            a.profile.degree_plan_code += "," + code
            a.profile.save()
            res = JsonResponse({"response": "success"})
            return HttpResponse(res)
        else:
            i = 0
            while i < len(store_code)-5:
                if store_code[i: i + 10] == code:
                    a.profile.degree_plan_code.strip(store_code[i:i + 10])
                    a.profile.save()
                    res = JsonResponse({"response": "success"})
                    return HttpResponse(res)
                i += 11
    res = JsonResponse({"response": "error"})
    return HttpResponse(res)
