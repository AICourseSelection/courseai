# Generated by Django 2.0.7 on 2018-10-08 05:20

import django.contrib.postgres.fields.jsonb
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('degree', '0036_auto_20181008_0503'),
    ]

    operations = [
        migrations.AlterField(
            model_name='degreerequirement',
            name='required',
            field=django.contrib.postgres.fields.jsonb.JSONField(),
        ),
        migrations.AlterField(
            model_name='major',
            name='requirements',
            field=django.contrib.postgres.fields.jsonb.JSONField(),
        ),
    ]
