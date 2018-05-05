from django.db import models


# Create your models here.
class Degree(models.Model):
    code = models.CharField(max_length=10)
    name = models.CharField(max_length=150)
    requirements = models.TextField()
    number_of_enrolments = models.IntegerField(default=1)
    metrics = models.TextField(default="{}")

    def __str__(self):
        return self.name


class PreviousStudentDegree(models.Model):
    code = models.CharField(max_length=10)
    courses_taken = models.TextField()
