# Generated by Django 2.1.1 on 2018-10-07 14:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('degree', '0029_auto_20181007_1409'),
    ]

    operations = [
        migrations.AlterField(
            model_name='course',
            name='convenor',
            field=models.TextField(blank=True, default=''),
        ),
    ]
