# Generated by Django 2.1.1 on 2018-10-06 07:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('degree', '0019_course_min_units'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='learning_outomes',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='course',
            name='majors',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='course',
            name='minors',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AlterField(
            model_name='course',
            name='min_units',
            field=models.CharField(blank=True, max_length=5),
        ),
    ]
