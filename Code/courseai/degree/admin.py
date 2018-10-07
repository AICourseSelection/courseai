from django.contrib import admin
from .models import Degree
from .models import DegreeRequirement
from .models import Course
from django.contrib import admin
from django.contrib.postgres import fields
from django_json_widget.widgets import JSONEditorWidget



# Register your models here.

class CourseAdmin(admin.ModelAdmin):
    search_fields = ('name','code')


class DegreeRequirementAdmin(admin.ModelAdmin):
    search_fields = ('name','code')
    formfield_overrides = {
        fields.JSONField: {'widget': JSONEditorWidget},
    }

admin.site.register(Degree)
admin.site.register(DegreeRequirement,DegreeRequirementAdmin)
admin.site.register(Course, CourseAdmin)
