// Cached Data
let KNOWN_COURSES = {};         // 2D Dictionary: (code, year) -> CourseOffering object
let KNOWN_MMS = {};             // 2D Dictionary: (code, year) -> MMS object
let KNOWN_DEGREES = {};         // 2D Dictionary: (code, year) -> Degree object
let KNOWN_COURSE_LISTS = {};    // Dictionary: list name (e.g. CBE_List_1) -> List of codes

// Retrieve Data

/**
 * Batch retrieve course titles, and perform an action with each one.
 * Retrieve titles for all the courses at once.
 * Then, the function provided with each course code will be evaluated with the title as a parameter.
 * @param courses_actions   An object, mapping course codes to functions.
 */
function batchCourseTitles(courses_actions) {
    $.ajax({
        'url': 'degree/coursedata',
        data: {
            'query': 'titles',
            'codes': JSON.stringify(Object.keys(courses_actions)) //TODO: Fix for Course Years
        },
        success: function (data) {
            for (const course of data.response) {
                for (const action of courses_actions[course['title']]) {
                    action(course['title']);
                }
            }
        }
    });
}

function getCourseOffering(code, year) {
    if (!(code in KNOWN_COURSES)) KNOWN_COURSES[code] = {};
    if (!(year in KNOWN_COURSES[code])) {
        $.ajax({
            url: 'degree/coursedata',
            data: {'query': code},
            success: function (data) {
                KNOWN_COURSES[code][year] = new CourseOffering(
                    code, year,
                    data.title,
                    data.units,
                    data.prerequisites,
                    {'description': data.description},
                    data['repeatable'] || false);
            },
            async: false
        })
    }
    return KNOWN_COURSES[code][year];
}

async function batchCourseOfferings(courses) {
    //TODO: Make API endpoint like coursedata, for many at a time.
    for (const offering of courses) {
        const code = offering.slice(0, -4);
        const year = offering.slice(-4);
        if (!(code in KNOWN_COURSES)) KNOWN_COURSES[code] = {};
        if (!(year in KNOWN_COURSES[code])) {
            $.ajax({
                url: 'degree/coursedata',
                data: {'query': code},
                success: function (data) {
                    KNOWN_COURSES[code][year] = new CourseOffering(
                        code, year,
                        data.title,
                        data.units,
                        data.prerequisites,
                        {'description': data.description},
                        data['repeatable'] || false);
                }
            })
        }
    }
}

function getMMSOffering(code, year) {
    if (!(code in KNOWN_MMS)) KNOWN_MMS[code] = {};
    if (!(year in KNOWN_MMS[code])) {
        $.ajax({
            url: 'search/mms',
            data: {'query': code},
            success: function (data) {
                KNOWN_MMS[code][year] = new MMS(code, year, data.name, data.composition);
            },
            async: false
        })
    }
    return KNOWN_MMS[code][year];
}

function getDegreeOffering(code, year) {
    if (!(code in KNOWN_DEGREES)) KNOWN_DEGREES[code] = {};
    if (!(year in KNOWN_DEGREES[code])) {
        $.ajax({
            url: 'degree/degreereqs',
            data: {'query': code},
            success: function (data) {
                KNOWN_DEGREES[code][year] = new Degree(code, year, data.name, data.required);
                //TODO: Support Optional Rule Sections
            },
            async: false
        });
        $.ajax({
            url: 'degree/degreeplan',
            data: {
                'query': code,
                'start_year_sem': year + "S1"
            },
            success: function (data) {
                KNOWN_DEGREES[code][year].suggestedPlan = data.response;
            },
            async: false
        })
    }
    return KNOWN_DEGREES[code][year];
}

// Send Data
function preparePlanForUpload(plan) {
    sessions = [];
    for (const session in plan.sessions) {
        if (!plan.sessions.hasOwnProperty(session)) continue;
        if (!plan.courses.hasOwnProperty(session)) continue;
        to_add = {session: []};
        for (const enrolment of plan.courses[session]) {
            to_add[session].push({'code': enrolment.code, 'title': enrolment.course.title});
        }
        sessions.push(to_add);
    }
    return sessions;
}
