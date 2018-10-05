from django.db import models
import json
from degree.course_data_helper import es_conn

# Create your models here.
class Degree(models.Model):
    code = models.CharField(max_length=10)
    name = models.CharField(max_length=150)
    requirements = models.TextField()
    number_of_enrolments = models.IntegerField(default=1)
    metrics = models.TextField(default="{}")

    def __str__(self):
        return self.name


class PreviousStudentDegree(models.Model):
    code = models.CharField(max_length=10)
    courses_taken = models.TextField()

class DegreePlanStore(models.Model):
    """
        Stores plaintext for plan
    """
    code = models.CharField(max_length=10)
    plan = models.TextField()


class Course(models.Model):

    es_id = models.CharField(max_length=10, db_index=True, editable=False, default="")
    name = models.CharField(max_length=60,default="",blank=True)
    code = models.CharField(max_length=9,default="",blank=True)
    semesters = models.TextField(default="",blank=True)
    prerequisite_text=models.TextField(default="",blank=True)
    prerequisites = models.TextField(default="",blank=True)
    level = models.CharField(max_length=4,default="",blank=True)
    area = models.CharField(max_length=4,default="",blank=True)
    description=models.TextField(default="",blank=True)
    graduation_stage = models.CharField(max_length=60,default="Undergraduate", choices=(("Undergraduate","Undergraduate"),("Postgraduate","Postgraduate")))
    convenor = models.CharField(max_length=60,default="",blank=True)
    units = models.CharField(max_length=60, default="",blank=True)
    year = models.CharField(max_length=4,default="",blank=True)

    # generate the es body including version, will develop this outside pycharm
    def _es_body(self):
        data = Course.objects.filter(code=self.code)

        initial = data[0]
        source = {}
        source['level'] = initial.level
        source['area'] = initial.area
        source['course_code'] = initial.code
        source['ugpg'] = initial.graduation_stage

        versions = {}
        for course_model in data:
            version = {}
            version['prerequisite_text'] = course_model.prerequisite_text
            version['prerequisites'] = course_model.prerequisites
            version['sessions'] = course_model.semesters
            version['units'] = course_model.units
            version['description'] = course_model.description
            version['title'] = course_model.name
            versions[course_model.year] = version

        source['versions'] = versions
        print(source)
        return source

    def __str__(self):
        return self.name+" "+self.year

    def save(self,no_es=False):
        super().save()
        if(no_es):
            return
        es_conn.update(index='courseupdated', doc_type='_doc', id=self.es_id, body={"doc":self._es_body()})

    def delete(self):
        es_conn.delete(index='courseupdated', doc_type='_doc', id=self.es_id)
        #super().delete()



class DegreeRequirement(models.Model):
    year = models.CharField(max_length=4, default="")
    code = models.CharField(max_length=6,default="")
    name = models.CharField(max_length=60)
    units = models.CharField(max_length=3,default="")
    required=models.TextField(default="")

    def __str__(self):
        return self.name+" - "+self.year

    def _json(self):
        to_return = {}
        to_return["year"] =self.year
        to_return["code"] = self.code
        to_return["name"] = self.name
        to_return["units"] = self.units
        to_return["required"] = json.loads(self.required.replace("'","\""))
        return json.dumps(to_return)



