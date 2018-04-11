
class Degree:
    def __init__(self, start_sem, start_year):
        self.courses = []
        self.start_sem = start_sem
        self.start_year = start_year

    def populate_courses(self, course_text):
        sem_list = course_text.split("\n")
        current_sem = self.start_sem
        current_year = self.start_year

        for sem in sem_list:
            course_text = sem.split(",")
            self.courses.append(list(map(lambda c: str(Course(c, current_sem, current_year)), course_text)))
            if current_sem == 2:
                current_year += 1
            current_sem = 3 - current_sem

    def __str__(self):
        return str(self.courses)


class Course:
    def __init__(self, code, semester, year):
        self.code = code
        self.semester = semester
        self.year = year

    # should look something like COMP1100 Sem 1, 2016
    def __str__(self):
        return self.code


if __name__ == '__main__':
    d = Degree(1, 2016)
    d.populate_courses("MATH1115, STAT1003, COMP1130, COMP2300" + '\n' +
                       "COMP1140, COMP2400, MATH1116, COMP2600" + '\n' +
                       "COMP2100, COMP3620, COMP2550" + '\n' +
                       "COMP2310, COMP2130, COMP2560, FINM1001, COMP3600" + '\n' +
                       "COMP3550, COMP4660, COMP4670, COMP3630")
    print(d)
