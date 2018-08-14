function Course(code, sessions) {
    this.code = code;
    this.sessions = sessions || [];

    this.addSession = function (session) {
        if (this.sessions.includes(session)) return;
        this.sessions.push(session)
    }
}

/**
 * Class that represents a course in a particular year.
 * @param {string} code     Course code, e.g. COMP1100.
 * @param {int} year        Version of the course, e.g. 2016, for the 2016 version of COMP1100.
 * @param {string} title    Title of the course.
 * @param {int} units       Number of units the course provides. Usually 6.
 * @param {Object} rules    Course prerequisite and incompatibility rules.
 * @param {Object} extras   Description, learning outcomes, etc.
 * @param {boolean} repeatable  Whether or not this course can be taken across multiple sessions.
 */
function CourseOffering(code, year, title, units, rules, extras, repeatable = false) {
    this.code = code;
    this.year = year;
    this.title = title;
    this.units = units;
    this.rules = rules;
    this.extras = extras;
    this.repeatable = repeatable;
}

/**
 * Class that represents a course currently in a plan.
 * @param {CourseOffering} course   CourseOffering object representing the course.
 * @param {string} session          The session that this course is taken in, e.g. 2016S1.
 */
function CourseEnrolment(course, session) {
    this.code = course.code;
    this.course = course;
    this.session = session;

    this.failed = false;    // Default to not failed.
    this.grade = null;      // Do not store grade data by default.
    this.notes = null;      // Do not store notes data by default.

    /**
     * Check if the requirements for this course have been met.
     * @param plan  The degree plan to check requirements against.
     */
    this.checkRequirements = function (plan) {
        let incompatible_courses = [];
        let overall_sat = true;

        let courses_taken = [];
        for (let session of plan.sessions) {
            if (session === this.session) break;
            Array.prototype.push.apply(courses_taken, plan.courses[session]);
        }
        let courses_taking = plan.courses[this.session];

        for (let clause of this.course.rules) {
            let clause_sat = false;
            for (let course of clause) {
                if (clause_sat) continue;
                if (course.charAt(0) === '~') {
                    let code = course.slice(1);
                    if (checkCoursePresent(courses_taken.concat(courses_taking), code)) {
                        incompatible_courses.push(code);
                    } else clause_sat = true
                } else {
                    clause_sat = checkCoursePresent(courses_taken, course)
                }
            }
            overall_sat = overall_sat && clause_sat;
        }
        return {'sat': overall_sat, 'inc': incompatible_courses};
    };

    /**
     * Mark a course as having been failed.
     * @param {boolean} failed    Set to false to remove failed tag. Otherwise defaults to true.
     */
    this.markFailed = function (failed = true) {
        this.failed = failed
    };

    /**
     * Set the student's grade for a course.
     * @param {int} grade   User's grade from 0 to 100.
     */
    this.setGrade = function (grade) {
        this.grade = grade;
    };

    /**
     * Clear the student's grade info for a course.
     */
    this.clearGrade = function () {
        this.grade = null;
    };

    /**
     * Set the student's custom notes for a course.
     * @param {string} notes   User's own custom notes for the course.
     */
    this.setNotes = function (notes) {
        this.notes = notes;
    };

    /**
     * Clear the student's custom notes for a course.
     */
    this.clearNotes = function () {
        this.notes = null;
    };
}

/**
 * Determine if a user has completed a course code within a list of courses.
 * Ignores courses in the list which the user has marked as failed.
 * @param courses   The completed courses to look through.
 * @param code      The course code to search for.
 * @returns {boolean}   Whether the course with the code has been completed without failure.
 */
function checkCoursePresent(courses, code) {
    for (let c of courses) {
        if (c.code !== code || c.failed) continue;
        return true;
    }
}