from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.views import generic
from django.views.generic import View
from .forms import UserForm


class UserFormView(View):
    form_class = UserForm
    template_name = 'static_pages/registration.html'

    def get(self, request):
        form = self.form_class(None)
        return render(request, self.template_name, {'form': form})


    def post(self, request):
        form = self.form_class(request.POST)

        if form.is_valid():
            user = form.save(commit=False)

            # clean data
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            user.set_password(password)
            user.save()

            user = authenticate(username=username, password=password)

            if user is not None:
                if user.is_active:
                    login(request, user)
                    return redirect('search:index')

        return render(request, self.template_name, {'form': form})

# Create your views here.

def index(request):
    raise NotImplementedError("Blah")

def get_degree(request):
    raise NotImplementedError("Get degree not implemented")

def update_degree(request):
    raise NotImplementedError("Update degree not implemented")