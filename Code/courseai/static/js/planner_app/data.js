// Cached Data
let KNOWN_COURSES = {};         // 2D Dictionary: (code, year) -> CourseOffering object
let KNOWN_MMS = {};             // 2D Dictionary: (code, year) -> MMS object
let KNOWN_DEGREES = {};         // 2D Dictionary: (code, year) -> Degree object
let KNOWN_COURSE_LISTS = {};    // Dictionary: list name (e.g. CBE_List_1) -> List of codes

let COURSE_REQUESTS = {};       // 2D Dictionary: (code, year) -> AJAX call to degree/coursedata

// Retrieve Data

/**
 * Batch retrieve course titles, and perform an action with each one.
 * Retrieve titles for all the courses at once.
 * Then, the function provided with each course code will be evaluated with the title as a parameter.
 * @param courses_actions   An object, mapping a course code to a list of functions.
 */
async function batchCourseTitles(courses_actions) {
    let new_ca = {};
    for (course in courses_actions) {
        if (!(course in new_ca)) new_ca[course] = [];
        for (const action of courses_actions[course]) {
            new_ca[course].push(function (offering) {
                action(offering.title);
            })
        }
    }
    await batchCourseOfferingActions(new_ca);
}

async function getCourseOffering(code, year) {
    if (!(code in KNOWN_COURSES)) KNOWN_COURSES[code] = {};
    if (!(year in KNOWN_COURSES[code])) {
        if (year in (COURSE_REQUESTS[code] || {})) {  // Check if there is already a request to get this course
            await COURSE_REQUESTS[code][year];      // Wait for that request to complete
            return KNOWN_COURSES[code][year];       // The data has been retrieved, so return it
        } else {
            const req = $.ajax({
                url: 'degree/coursedata',
                data: {'query': code},
                success: function (data) {
                    const res = data.response;
                    if (!code in KNOWN_COURSES) KNOWN_COURSES[code] = {};
                    KNOWN_COURSES[code][year] = new CourseOffering(
                        code, year,
                        res.title,
                        res.units || 6, // TODO: Fix for Course Units
                        res.prerequisites,
                        {
                            'description': res.description,
                            'prerequisite_text': res.prerequisite_text,
                            'semester': res.semester    // TODO: Change for course sessions.
                        },
                        res['repeatable'] || false);
                },
            });
            if (!(code in COURSE_REQUESTS)) COURSE_REQUESTS[code] = {};
            COURSE_REQUESTS[code][year] = req;
            await req;
        }
    }
    return KNOWN_COURSES[code][year];
}

/**
 * Batch retrieve course data, and perform an action with each one.
 * Retrieve data for all the courses at once.
 * Then, the function provided with each course code will be evaluated with the CourseOffering as a parameter.
 * @param courses_actions   An object, mapping a course code to a list of functions.
 */
async function batchCourseOfferingActions(courses_actions) {
    if ($.isEmptyObject(courses_actions)) return;   // TODO: Check for other pending requests and only request new codes.
    let codesToRetrieve = [];
    for (const code in courses_actions) {
        if (code in KNOWN_COURSES && KNOWN_COURSES[code][THIS_YEAR]) continue; // TODO: Fix for Course Years
        codesToRetrieve.push(code);
    }
    await $.ajax({
        url: 'degree/coursedata',
        data: {
            'query': 'multiple',
            'codes': JSON.stringify(codesToRetrieve)
        },
        success: function (data) {
            console.log();
            for (const code in data.response) {
                if (!(data.response.hasOwnProperty(code))) continue;
                if (!(data.response)) continue;
                const course = data.response[code];
                const year = THIS_YEAR; //TODO: Fix for Course Years
                const offering = new CourseOffering(
                    code, year,
                    course.title,
                    course.units || 6, // TODO: Fix for Course Units
                    course.prerequisites,
                    {
                        'description': course.description,
                        'prerequisite_text': course.prerequisite_text,
                        'semester': course.semester   // TODO: Change for course sessions.
                    },
                    course['repeatable'] || false);
                if (!(code in KNOWN_COURSES)) KNOWN_COURSES[code] = {};
                if (!(year in KNOWN_COURSES[code])) KNOWN_COURSES[code][year] = offering;
            }
            for (const code in courses_actions) {
                if (!((KNOWN_COURSES[code] || {})[THIS_YEAR])) continue; // Skip failed retrievals.
                for (const action of courses_actions[code]) {
                    action(KNOWN_COURSES[code][THIS_YEAR]); // TODO: Fix for Course Years
                }
            }
        }
    })
}

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
        try {
            await $.ajax({
                url: 'degree/degreereqs',
                data: {'query': code + '-' + year},
                success: function (data) {
                    if (!code in KNOWN_DEGREES) KNOWN_DEGREES[code] = {};
                    KNOWN_DEGREES[code][year] = new Degree(code, year, data.name, data.units, data.required);
                    //TODO: Support for Optional Rule Sections
                }
            });
        } catch (error) {
            console.log('Failed to retrieve degree program requirements for ' + code + '-' + year);
            console.log('Attempting to get 2018 requirements.');
            try {
                await $.ajax({
                    url: 'degree/degreereqs',
                    data: {'query': code},
                    success: function (data) {
                        if (!code in KNOWN_DEGREES) KNOWN_DEGREES[code] = {};
                        KNOWN_DEGREES[code][year] = new Degree(code, THIS_YEAR, data.name, data.units, data.required);
                        //TODO: Support for Optional Rule Sections
                    },
                    error: function () {


                    }
                });
            } catch (error) {
                KNOWN_DEGREES[code][year] = new Degree(code, year, degree_name, 144, {});
                console.log('Failed to retrieve degree program requirements for ' + code);
                console.log('Creating generic degree');
            }

        }
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

async function getCourseList(name) {
    if (name in KNOWN_COURSE_LISTS) return KNOWN_COURSE_LISTS[name];
    await $.ajax({
        url: 'search/courselists',
        data: {'query': name},
        success: function (data) {
            KNOWN_COURSE_LISTS[name] = data.response.courses;
        }
    });
    return KNOWN_COURSE_LISTS[name]
}

// Send Data
function preparePlanForUpload(plan) {
    sessions = [];
    for (const session of plan.sessions) {
        to_add = {[session]: []};
        for (const enrolment of plan.courses[session]) {
            to_add[session].push({'code': enrolment.code, 'title': enrolment.course.title});
        }
        sessions.push(to_add);
    }
    return sessions;
}

// function generateBlankDegreePlan()