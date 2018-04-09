from django.db import models


class Student(models.Model):
    name = models.CharField(max_length=100)
    degree = models.CharField(max_length=1000, default="[]")
    start_year = models.IntegerField(default=2016)
    start_semester = models.IntegerField(default=1)
    interests = models.CharField(max_length=200, default="[]")

    def __str__(self):
        return str(self.name)
