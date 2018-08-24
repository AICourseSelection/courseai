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
 * @param courses_actions   An object, mapping a course code to a list of functions.
 */
async function batchCourseTitles(courses_actions) {
    if (jQuery.isEmptyObject(courses_actions)) return;
    $.ajax({
        url: 'degree/coursedata',
        data: {
            'query': 'titles',
            'codes': JSON.stringify(Object.keys(courses_actions)) //TODO: Fix for Course Years
        },
        dataType: 'json',
        contentType: 'application/json',
        success: function (data) {
            for (const course of data.response) {
                for (const action of courses_actions[course['course_code']]) {
                    action(course['title']);
                }
            }
        }
    });

}

async function batchCoursePrereqs(courses_actions) {
    // TODO: Generalise this and batchCourseTitles into one.
    if (jQuery.isEmptyObject(courses_actions)) return;
    let req = $.ajax({
        url: 'degree/coursedata',
        data: {
            'query': 'prereqs',
            'codes': JSON.stringify(Object.keys(courses_actions)) //TODO: Fix for Course Years
        },
        success: function (data) {
            for (const course of data.response) {
                for (const action of courses_actions[course['course_code']]) {
                    action(course['prerequisite_text'], course['prerequisites'], course['semester']);
                }
            }
        }
    });

}

async function getCourseOffering(code, year) {
    if (!(code in KNOWN_COURSES)) KNOWN_COURSES[code] = {};
    if (!(year in KNOWN_COURSES[code])) {
        await $.ajax({
            url: 'degree/coursedata',
            data: {'query': code},
            success: function (data) {
                const res = data.response;
                if (!code in KNOWN_COURSES) KNOWN_COURSES[code] = {};
                KNOWN_COURSES[code][year] = new CourseOffering(
                    code, year,
                    res.title,
                    res.units,
                    res.prerequisites,
                    {
                        'description': res.description,
                        'prerequisite_text': res.prerequisite_text,
                        'semester': res.semester    // TODO: Change for course sessions.
                    },
                    res['repeatable'] || false);
            },
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
                        {
                            'description': data.description,
                            'prerequisite_text': data.prerequisite_text,
                            'semester': data.semester   // TODO: Change for course sessions.
                        },
                        data['repeatable'] || false);
                }
            })
        }
    }
}

// function getLatestCourseOffering(code) {
//     if (!(code in KNOWN_COURSES)) return;
//     let frontier_year = "";
//     let frontier_offering = null;
//     for (const year in KNOWN_COURSES[code]) {
//         if (year > frontier_year && year < THIS_YEAR) { // Do not pass the current year
//             frontier_year = year;
//             fontier_offering = KNOWN_COURSES[code][year];
//         }
//     }
//     return frontier_offering;
// }

async function getMMSOffering(code, year) {
    if (!(code in KNOWN_MMS)) KNOWN_MMS[code] = {};
    if (!(year in KNOWN_MMS[code])) {
        await $.ajax({
            url: 'search/mms',
            data: {'query': code},
            success: function (data) {
                if (!code in KNOWN_MMS) KNOWN_MMS[code] = {};
                KNOWN_MMS[code][year] = new MMS(code, year, data.name, data.composition);
            }
        })
    }
    return KNOWN_MMS[code][year];
}

async function batchMMSData(mms_actions) {
    if (jQuery.isEmptyObject(mms_actions)) return;
    for (const mms in mms_actions) {
        if (!mms_actions.hasOwnProperty(mms)) continue;
        const code = mms.split('/')[0];
        const year = mms.split('/')[1];
        $.ajax({
            url: 'search/mms',
            data: {
                'query': code,
            },
            success: function (data) {
                if (!(code in KNOWN_MMS)) KNOWN_MMS[code] = {};
                const new_mms = new MMS(code, year, data.name, data.composition);
                KNOWN_MMS[code][year] = new_mms;
                for (const action of mms_actions[mms]) {
                    action(new_mms)
                }
            }
        });
    }
}

async function getDegreeOffering(code, year) {
    if (!(code in KNOWN_DEGREES)) KNOWN_DEGREES[code] = {};
    if (!(year in KNOWN_DEGREES[code])) {
        await $.ajax({
            url: 'degree/degreereqs',
            data: {'query': code},
            success: function (data) {
                if (!code in KNOWN_DEGREES) KNOWN_DEGREES[code] = {};
                KNOWN_DEGREES[code][year] = new Degree(code, year, data.name, data.required);
                //TODO: Support for Optional Rule Sections
            }
        });
        await $.ajax({
            url: 'degree/degreeplan',
            data: {
                'query': code,
                'start_year_sem': year + "S1"
            },
            success: function (data) {
                KNOWN_DEGREES[code][year].suggestedPlan = data.response;
            }
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
