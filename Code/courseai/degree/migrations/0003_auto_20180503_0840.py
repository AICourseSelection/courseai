# Generated by Django 2.0.4 on 2018-05-03 08:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('degree', '0002_auto_20180430_0524'),
    ]

    operations = [
        migrations.AddField(
            model_name='degree',
            name='metrics',
            field=models.TextField(default='{}'),
        ),
        migrations.AddField(
            model_name='degree',
            name='number_of_enrolments',
            field=models.IntegerField(default=1),
        ),
    ]
