/**
 * Created by Joseph Meltzer on 25/04/18.
 */
var dp = {  // TEST DEGREE PROGRAM
    "degree_program": "Bachelor of Advanced Computing (Honours)",
    "start_year": 2016,
    "start_semester": 1,
    "courses": {
        "2016S1": [
            {
                "code": "COMP1130",
                "title": "Introduction to Programming and Algorithms (Advanced)"
            },
            {
                "code": "MATH1115",
                "title": "Advanced Mathematics and Applications 1"
            },
            {
                "code": "STAT1003",
                "title": "Statistical Techniques"
            },
            {
                "code": "Elective Course"
            }
        ],
        "2016S2": [
            {
                "code": "COMP1140",
                "title": "Introduction to Software Systems (Advanced)"
            },
            {
                "code": "MATH1116",
                "title": "Advanced Mathematics and Applications 2"
            },
            {
                "code": "COMP2600",
                "title": "Formal Methods in Software Engineering"
            },
            {
                "code": "Elective Course"
            }
        ],
        "2017S1": [
            {
                "code": "COMP2100",
                "title": "Software Construction"
            },
            {
                "code": "COMP2300",
                "title": "Introduction to Computer Systems"
            },
            {
                "code": "COMP2550",
                "title": "Advanced Computing R&D Methods"
            },
            {
                "code": "Elective Course"
            }
        ],
        "2017S2": [
            {
                "code": "COMP2130",
                "title": "Software Analysis and Design"
            },
            {
                "code": "COMP2310",
                "title": "Concurrent and Distributed Systems"
            },
            {
                "code": "COMP2560",
                "title": "Studies in Advanced Computing R&D"
            },
            {
                "code": "Elective Course"
            }
        ]
    }
};
const title_text = dp["degree_program"] + " starting " + dp["start_year"] + " Semester " + dp["start_semester"];
var title_box = $('#degree-title');
title_box.prepend(title_text);
title_box.hover(function () {
    $('#edit-button').fadeIn(150);
}, function () {
    $('#edit-button').fadeOut(150);
});

var tab_index_count = 4;
var grid = $('#plan-grid');
var course_dict = dp["courses"];
for (var session in course_dict) {
    if (course_dict.hasOwnProperty(session)) {
        const year = session.split('S')[0];
        const sem = session.split('S')[1];
        var first_cell = '<div class="first-cell">' +
            '<div class="row-year h4">' + year + '</div>' +
            '<div class="row-sem h5">Semester ' + sem + '</div>' +
            '</div>';
        var row = $('<div class="plan-row"/>');
        row.append(first_cell);
        const course_list = course_dict[session];
        for (var i in course_list) {
            const course = course_list[i];
            var cell = $('<div class="plan-cell result-course" tabindex="' + tab_index_count + '"/>');
            tab_index_count++;
            cell.append('<div class="course-code">' + course['code'] + '</div>');
            cell.append('<div class="course-title">' + (course['title'] || "") + '</div>');
            row.append(cell);
        }
        grid.append(row);
    }
}

function coursePopoverSetup() {
    const code = $(this).find('.course-code').text();
    if (code === "Elective Course") return;
    const title = $(this).find('.course-title').text();
    $(this).popover({
        trigger: 'click',
        title: code,
        placement: 'right',
        html: true,
        content: '<div class="h6 result-title mb-1">' + title + '</div>\n' +
        '<div class="d-flex">\n' +
        '    <div class="fa fa-refresh fa-spin mx-auto my-auto py-2" style="font-size: 2rem;"></div>\n' +
        '</div>',
        template: '<div class="popover course-popover" role="tooltip">\n' +
        '    <div class="arrow"></div>\n' +
        '    <div class="h3 popover-header"></div>\n' +
        '    <div class="popover-body"></div>\n' +
        '</div>'
    });
    $(this).on('show.bs.popover', coursePopoverData)
}

function coursePopoverData() {
    const code = $(this).find('.course-code').text();
    var popover = $(this).data('bs.popover');
    if (popover['data-received'] || false) {
        return;
    }
    $.ajax({
        url: 'degree/coursedata',
        data: {'query': code},
        success: function (data) {
            var curr_popover = $(popover.tip);
            if (!data.response) {
                curr_popover.find('.fa-refresh').css({'display': 'none'});
                curr_popover.find('.popover-body').append(
                    '<div class="alert-danger my-1 px-1" style="border-radius: .2rem">' +
                    'This courses\'s information could not be retrieved. Please try again. </div>');
                return
            }
            const html = '<h6 class="mt-2">Description</h6>\n' +
                '<div class="result-description">' + data.response['description'] + '</div>\n' +
                '<h6 class="mt-2">Learning Outcomes</h6>\n' +
                '<div class="result-learning">' + data.response['learning_outcomes'] + '</div>\n' +
                '<h6 class="mt-2">Related Courses</h6>\n' +
                '<div class="list-group">\n' +
                '    <div class="draggable-course result-course list-group-item list-group-item-action">\n' +
                '        <span class="course-code">COMP4670</span>\n' +
                '        <span class="course-title">Introduction to Statistical Machine Learning</span>\n' +
                '    </div>\n' +
                '    <div class="draggable-course result-course list-group-item list-group-item-action">\n' +
                '        <span class="course-code">COMP4680</span>\n' +
                '        <span class="course-title">Advanced Topics in Statistical Machine Learning</span>\n' +
                '    </div>\n' +
                '</div>';
            popover.config.content = $(popover.config.content).first().prop('outerHTML');
            popover.config.content += html;
            curr_popover.find('.fa-refresh').css({'display': 'none'});
            curr_popover.find('.popover-body').append(html);
            popover['data-received'] = true;
        },
        error: function () {
            console.log('Error retrieving data for ' + code)
        }
    })
}

$('.result-course').each(coursePopoverSetup);

function mmsPopoverSetup() {
    const name = $(this).find('.mms-name').text();
    $(this).popover({
        trigger: 'click',
        title: name,
        placement: 'right',
        html: true,
        content: '<div class="d-flex">\n' +
        '    <div class="fa fa-refresh fa-spin mx-auto my-auto py-2" style="font-size: 2rem;"></div>\n' +
        '</div>',
        template: '<div class="popover mms-popover" role="tooltip">\n' +
        '    <div class="arrow"></div>\n' +
        '    <div class="h3 popover-header"></div>\n' +
        '    <div class="mms-add"><button class="btn btn-info btn-sm">Add to Plan</button></div>\n' +
        '    <div class="popover-body"></div>\n' +
        '</div>'
    });
    $(this).on('show.bs.popover', mmsPopoverData)
}

function mmsPopoverData() {
    const code = $(this).find('.mms-code').text();
    var popover = $(this).data('bs.popover');
    if (popover['data-received'] || false) {
        return;
    }
    $.ajax({
        url: 'degree/mms',
        data: {'query': code},
        success: function (data) {
            var curr_popover = $(popover.tip);
            if (data.hasOwnProperty('error')) {
                curr_popover.find('.fa-refresh').css({'display': 'none'});
                curr_popover.find('.popover-body').append(
                    '<div class="alert-danger my-1 px-1" style="border-radius: .2rem">' +
                    'Description could not be retrieved. Please try again. </div>');
                return
            }
            const html = '<h6 class="mt-2">Required Courses</h6>\n' +
                '<div class="result-composition">' + data['composition'] + '</div>\n';
            popover.config.content = html;
            curr_popover.find('.fa-refresh').css({'display': 'none'});
            curr_popover.find('.popover-body').append(html);
            popover['data-received'] = true;
        },
        error: console.log('Error retrieving data for' + code)
    })
}

var curr_requests = {'course': null, 'major': null, 'minor': null, 'spec': null};

$('#add-course').on('keyup', function () {
    for (var key in curr_requests) {
        if (curr_requests.hasOwnProperty(key) && curr_requests[key] !== null) {
            curr_requests[key].abort();
        }
    }
    curr_requests['course'] = $.ajax({
        url: 'search?query=' + $(this).val(),
        type: 'GET',
        dataType: 'json',
        contentType: 'application/json',
        beforeSend: function () {
            var resultsList = $('#search-results-list');
            resultsList.find('.fa-refresh').css({'display': 'inline-block'});
            resultsList.find('.collapse').css({'display': 'none'});
            resultsList.find('.result-course').popover('hide');
        },
        success: updateCourseSearchResults,
        error: console.log('Course search aborted or failed. '),
        complete: console.log('Course search initiated. ')
    });

    curr_requests['major'] = $.ajax({
        url: 'degree/majors?query=' + $(this).val(),
        type: 'GET',
        dataType: 'json',
        contentType: 'application/json',
        success: function (data) {
            updateMMSResults(data, 'major', $('#results-majors'))
        },
        error: console.log('Major search aborted or failed. '),
        complete: console.log('Major search initiated. ')
    });
    curr_requests['minor'] = $.ajax({
        url: 'degree/minors?query=' + $(this).val(),
        type: 'GET',
        dataType: 'json',
        contentType: 'application/json',
        success: function (data) {
            updateMMSResults(data, 'minor', $('#results-minors'))
        },
        error: console.log('Minor search aborted or failed. '),
        complete: console.log('Minor search initiated. ')
    });
    curr_requests['spec'] = $.ajax({
        url: 'degree/specs?query=' + $(this).val(),
        type: 'GET',
        dataType: 'json',
        contentType: 'application/json',
        success: function (data) {
            updateMMSResults(data, 'specialisation', $('#results-specs'))
        },
        error: console.log('Specialisation search aborted or failed. '),
        complete: console.log('Specialisation search initiated. ')
    });
});

function updateMMSResults(data, type, section) {
    var responses = data['responses'];
    var body = $(section.find('.card-body'));

    body.find('.result-mms').popover('dispose');
    body.empty();
    if (responses.length > 0) {
        for (var i = 0; i < responses.length; i++) {
            const code = responses[i]['code'];
            const name = responses[i]['name'];
            var item = $(
                '<div class="draggable-course result-mms list-group-item list-group-item-action">\n    ' +
                '<span class="mms-code">' + code + '</span>' +
                '<span class="mms-name">' + name + '</span>\n' +
                '</div>');
            item.each(mmsPopoverSetup);
            body.append(item);
        }
    } else {
        body.append('<div class="m-2">No ' + type + 's found.</div>');
    }
    section.parent().find('.fa-refresh').css({'display': 'none'});
    section.parent().find('.collapse').css({'display': ''});
    section.collapse('show');
    console.log(type + ' search successful')
}

function updateCourseSearchResults(data) {
    var response = data['response'];
    var results = $('#results-courses');
    var cbody = $(results.find('.card-body'));

    cbody.find('.result-course').popover('dispose');
    cbody.empty();
    if (response.length > 0) {
        for (var i = 0; i < response.length; i++) {
            const code = response[i]['code'];
            const title = response[i]['title'];
            var item = $(
                '<div class="draggable-course result-course list-group-item list-group-item-action">\n    ' +
                '<span class="course-code">' + code + '</span>\n    ' +
                '<span class="course-title">' + title + '</span>\n' +
                '</div>');
            item.each(coursePopoverSetup);
            cbody.append(item);
        }
    } else {
        cbody.append('<div class="m-2">No courses found.</div>');
    }
    results.parent().find('.fa-refresh').css({'display': 'none'});
    results.parent().find('.collapse').css({'display': ''});
    results.collapse('show');
    console.log('course search successful')
}

$('#results-courses').on('hide.bs.collapse', function () {
    $(this).find('.result-course').popover('hide');
});

$('#results-majors, #results-minors, #results-specs').on('hide.bs.collapse', function () {
    $(this).find('.result-mms').popover('hide');
});

const current_filters = new Set();

$('.plan-cell').click(function () {
    if ($(this).find('.course-code').text() === 'Elective Course') {
        var first_cell = $(this).parent().find('.first-cell');
        const year = first_cell.find('.row-year').text();
        const sem = first_cell.find('.row-sem').text();
        const badge_text = 'My ' + year + ' ' + sem;
        if (current_filters.has(badge_text)) {
            return;
        }
        var filter_icon = $('<span class="badge badge-primary">' + badge_text +
            '</span>');
        var delete_button = $('<a class="filter-delete">×</a>');
        delete_button.click(deleteFilter);
        filter_icon.append(delete_button);
        $('#filter-icons').append(filter_icon, ' ');
        current_filters.add(badge_text);
    }
});

function deleteFilter() {
    current_filters.delete(this.previousSibling.textContent);
    $(this).parent().remove();
}

$('.filter-delete').click(deleteFilter);
