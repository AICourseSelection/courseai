# Generated by Django 2.2.5 on 2019-10-08 04:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('degree', '0025_course_degreerequirement_major_minor_specialisation'),
    ]

    operations = [
        migrations.CreateModel(
            name='all_program',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(default='', max_length=10)),
                ('title', models.TextField(blank=True, default='')),
            ],
        ),
    ]
