# Generated by Django 2.0.7 on 2018-10-08 06:10

import django.contrib.postgres.fields.jsonb
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('degree', '0042_minor'),
    ]

    operations = [
        migrations.CreateModel(
            name='Specialisation',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('es_id', models.CharField(default='', editable=False, max_length=10)),
                ('name', models.TextField(blank=True, default='')),
                ('code', models.CharField(blank=True, default='', max_length=9)),
                ('year', models.CharField(blank=True, default='', editable=False, max_length=4)),
                ('description', models.TextField(blank=True, default='')),
                ('graduation_stage', models.CharField(choices=[('undergraduate', 'undergraduate'), ('postgraduate', 'postgraduate')], default='undergraduate', max_length=60)),
                ('requirements', django.contrib.postgres.fields.jsonb.JSONField(default=list)),
                ('learning_outcomes', models.TextField(blank=True, default='')),
            ],
        ),
    ]
