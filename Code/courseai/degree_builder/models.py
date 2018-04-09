from django.db import models


class Users(models.Model):
    name = models.CharField(max_length=100)
    degree = models.CharField(max_length=1000)
    start_year = models.IntegerField(default=2016)
    start_semester = models.IntegerField(default=1)

    def __str__(self):
        return str(self.name)
