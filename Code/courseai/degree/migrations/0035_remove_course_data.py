# Generated by Django 2.0.7 on 2018-10-07 15:37

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('degree', '0034_course_data'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='course',
            name='data',
        ),
    ]
