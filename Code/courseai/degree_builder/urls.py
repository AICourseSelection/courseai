from django.urls import path
from django.views.generic import TemplateView

from . import views


urlpatterns = [
    path('', TemplateView.as_view(template_name='dynamic_pages/index.html'), name='index'),
    path('login', views.user_login, name='login'),
    path('planner', views.planner, name='planner'),
    path('get_degree', views.get_degree, name='get_degree'),
    path('update_degree', views.update_degree, name='update_degree'),
]
