from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.db import models

class Profile(models.Model):
    ROLE_CHOICES = (
        ('Student', 'Student'),
        ('Staff', 'Staff'),
    )
    # if we delete User, delete profile. If we delete profile, delete User.
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    # If blank=True then the field will not be required
    # Blank values for Django field types such as DateTimeField or ForeignKey will be stored as NULL in the DB.
    degree_plan_code = models.CharField(max_length=300, blank=True)
    role = models.PositiveSmallIntegerField(choices=ROLE_CHOICES, null=True, blank=True)

@receiver(post_save, sender=User) # get signal from User model
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
    instance.profile.save()


