# Generated by Django 2.0.7 on 2018-10-08 05:37

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('degree', '0039_major'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='degreerequirement',
            name='required',
        ),
        migrations.RemoveField(
            model_name='major',
            name='requirements',
        ),
    ]
