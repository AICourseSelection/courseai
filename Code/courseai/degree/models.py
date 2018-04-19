from django.db import models


# Create your models here.
class Degree(models.Model):
    code = models.CharField(max_length=10)
    name = models.CharField(max_length=150)
    requirements = models.TextField()