from django.db import models

# Create your models here.

class Feedback(models.Model):
    text = models.TextField()
    email = models.TextField()
