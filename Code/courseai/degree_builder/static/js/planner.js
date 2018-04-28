/**
 * Created by Joseph Meltzer on 25/04/18.
 */
var degree_plan = {};

$.ajax({
    url: 'degree/degreeplan',
    data: {
        'query': degree_code,
        'start_year_sem': start_year + 'S' + start_sem
    },
    success: function (data) {
        const title_text = degree_name + " starting " + start_year + " Semester " + start_sem;
        var title_box = $('#degree-title');
        title_box.prepend(title_text);
        title_box.hover(function () {
            $('#edit-button').fadeIn(150);
        }, function () {
            $('#edit-button').fadeOut(150);
        });

        var tab_index_count = 4;
        var grid = $('#plan-grid');
        var course_dict = data["response"];
        for (var i in course_dict) {
            for (var session in course_dict[i]) {
                if (course_dict[i].hasOwnProperty(session)) {
                    degree_plan[session] = [];
                    const year = session.split('S')[0];
                    const sem = session.split('S')[1];
                    var first_cell = '<div class="first-cell">' +
                        '<div class="row-year h4">' + year + '</div>' +
                        '<div class="row-sem h5">Semester ' + sem + '</div>' +
                        '</div>';
                    var row = $('<div class="plan-row"/>');
                    row.append(first_cell);
                    const course_list = course_dict[i][session];
                    for (var j in course_list) {
                        const course = course_list[j];
                        degree_plan[session].push(course);
                        var cell = $('<div class="plan-cell result-course" tabindex="' + tab_index_count + '"/>');
                        tab_index_count++;
                        cell.append('<div class="course-code">' + course['code'] + '</div>');
                        cell.append('<div class="course-title">' + (course['title'] || "") + '</div>');
                        row.append(cell);
                    }
                    grid.append(row);
                }
            }
        }
        $('.result-course').each(coursePopoverSetup);
        $('.plan-cell').click(clickCell);
    }
});

function coursePopoverSetup() {
    const code = $(this).find('.course-code').text();
    if (code === "Elective Course") return;
    const title = $(this).find('.course-title').text();
    $(this).popover({
        trigger: 'click',
        title: code + '<a class="popover-close" onclick="closePopover(this)">×</a>',
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
    $(this).parents('.popover-region').find('.result-course').each(function () {
        if ($(this).find('.course-code').text() !== code) {
            $(this).popover('hide');
        }
    });
    var popover = $(this).data('bs.popover');
    if (popover['data-received'] || false) return;
    var curr_popover = $(popover.tip);
    $.ajax({
        url: 'degree/coursedata',
        data: {'query': code},
        success: function (data) {
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
    const code = $(this).find('.mms-code').text();
    $(this).popover({
        trigger: 'click',
        title: name + '<a class="popover-close" onclick="closePopover(this)">×</a>',
        placement: 'right',
        html: true,
        content: '<div class="d-flex">\n' +
        '    <div class="fa fa-refresh fa-spin mx-auto my-auto py-2" style="font-size: 2rem;"></div>\n' +
        '</div>',
        template: '<div class="popover mms-popover" role="tooltip" data-code="' + code + '">\n' +
        '    <div class="arrow"></div>\n' +
        '    <div class="h3 popover-header"></div>\n' +
        '    <div class="mms-add"><button class="btn btn-info btn-sm btn-mms-add">Add to Plan</button></div>\n' +
        '    <div class="popover-body"></div>\n' +
        '</div>'
    });
    $(this).on('show.bs.popover', mmsPopoverData)
}

function mmsPopoverData() {
    const code = $(this).find('.mms-code').text();
    var popover = $(this).data('bs.popover');
    var curr_popover = $(popover.tip);
    if (code in active_mms) {
        curr_popover.find('button').attr("disabled", true);
        curr_popover.find('button').text('Already in Plan');
    } else {
        curr_popover.find('button').attr("disabled", false);
        curr_popover.find('button').text('Add to Plan');

    }

    if (popover['data-received'] || false) {
        return;
    }
    $.ajax({
        url: 'degree/mms',
        data: {'query': code},
        success: function (data) {
            if (data.hasOwnProperty('error')) {
                curr_popover.find('.fa-refresh').css({'display': 'none'});
                curr_popover.find('.popover-body').append(
                    '<div class="alert-danger my-1 px-1" style="border-radius: .2rem">' +
                    'Description could not be retrieved. Please try again. </div>');
                return
            }
            mms_info[data['code']] = data;
            const html = '<h6 class="mt-2">Required Courses</h6>\n' +
                '<div class="result-composition">' + data['composition'] + '</div>\n';
            popover.config.content = html;
            curr_popover.find('.fa-refresh').css({'display': 'none'});
            curr_popover.find('.popover-body').append(html);
            popover['data-received'] = true;
            $('.mms-add button').click(mms_add);
        },
        error: function () {
            console.log('Error retrieving data for' + code);
        }
    })
}

function clickCell() {
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

$('.collapse').on('hide.bs.collapse', function () {
    $(this).find('.result-course').popover('hide');
});

$('#results-majors, #results-minors, #results-specs').on('hide.bs.collapse', function () {
    $(this).find('.result-mms').popover('hide');
});

const current_filters = new Set();

function deleteFilter() {
    current_filters.delete(this.previousSibling.textContent);
    $(this).parent().remove();
}

$('.filter-delete').click(deleteFilter);

const mms_info = {};
const active_mms = {};
const mms_abbrev = {
    'MAJ': 'Major',
    'MIN': 'Minor',
    'SPEC': 'Specialisation',
    'HSPC': 'Specialisation'
};
const mms_units = {
    'MAJ': 48,
    'MIN': 24,
    'SPEC': 24,
    'HSPC': 48
};
const course_titles = {};

function mms_add() {
    const code = $(this).parents('.popover').attr('data-code');
    if (code in active_mms) {
        return
    }
    $('#search-results-list').find('.result-mms').each(function () {
        if ($(this).find('.mms-code').text() === code) {
            $(this).popover('hide');
        }
    });
    active_mms[code] = {};
    const mms_data = mms_info[code];
    const type = code.split('-').pop();
    var mms_active_list = $('#mms-active-list');
    var new_mms = $('<div class="mms card"/>');
    var card_header = $(
        '<div class="card-header btn text-left pl-2" data-toggle="collapse" data-target="#mms-active-' + code + '">\n' +
        '    <span class="mms-code">' + code + '</span>\n' +
        '    <strong>' + mms_abbrev[type] + '</strong>: ' + mms_data['name'] + '\n' +
        '    <button class="mms-delete btn btn-danger" onclick="deleteMMS(this)">×</button>\n' +
        '    <span class="unit-count mr-2">0/' + mms_units[type] + '</span>\n' +
        '</div>');
    var collapsible = $(
        '<div id="mms-active-' + code + '" class="collapse show">' +
        '</div>'
    );
    collapsible.on('hide.bs.collapse', function () {
        $(this).find('.result-course').popover('hide');
    });

    for (var i in mms_data['composition']) {
        value = mms_data['composition'][i];
        if (value.type === "fixed") {
            var required = $('<div class="mms-required list-group list-group-flush"/>');
            var titles_to_retrieve = [];
            for (var j in value.course) {
                if (!(value.course[j].code in course_titles)) titles_to_retrieve.push(value.course[j].code);
            }
            if (titles_to_retrieve.length > 0) {
                $.ajax({
                    'url': 'degree/coursedata',
                    data: {
                        'query': 'titles',
                        'codes': JSON.stringify(titles_to_retrieve)
                    },
                    success: function (data) {
                        for (var k in data.response) {
                            course_titles[data.response[k]['course_code']] = data.response[k]['title']
                        }
                    },
                    async: false
                });
            }
            for (var j in value.course) {
                course = value.course[j];
                var item = $(
                    '<div class="list-group-item list-group-item-action draggable-course result-course">' +
                    '    <span class="course-code">' + course.code + '</span>' +
                    '    <span class="course-title">' + course_titles[course.code] + '</span>' +
                    '</div>'
                );
                item.each(coursePopoverSetup);
                required.append(item);
            }
            collapsible.append(required);
        } else if (['minimum', 'maximum'].indexOf(value.type) >= 0) {
            var label_text = 'at least ';
            if (value.type === 'maximum') label_text = 'up to ';
            var select = $(
                '<div class="mms-select-' + value.type.slice(0, 3) + ' card">\n' +
                '    <div class="card-header btn text-left pl-2" data-toggle="collapse"\n' +
                '         data-target="#mms-active-' + code + '-select' + i + '">\n' +
                '        Choose ' + label_text + value.units + ' units\n' +
                '        <span class="unit-count mr-2">0/' + value.units + '</span>\n' +
                '    </div>\n' +
                '</div>');
            var options = $('<div class="mms-optional list-group list-group-flush"/>');
            var titles_to_retrieve = [];
            for (var j in value.course) {
                if (!(value.course[j].code in course_titles)) titles_to_retrieve.push(value.course[j].code);
            }
            if (titles_to_retrieve.length > 0) {
                $.ajax({
                    'url': 'degree/coursedata',
                    data: {
                        'query': 'titles',
                        'codes': JSON.stringify(titles_to_retrieve)
                    },
                    success: function (data) {
                        for (var k in data.response) {
                            course_titles[data.response[k]['course_code']] = data.response[k]['title']
                        }
                    },
                    async: false
                });
            }
            for (var k in value.course) {
                course = value.course[k];
                var list_item = $(
                    '<div class="list-group-item list-group-item-action draggable-course result-course">' +
                    '    <span class="course-code">' + course.code + '</span>' +
                    '    <span class="course-title">' + course_titles[course.code] + '</span>' +
                    '</div>'
                );
                list_item.each(coursePopoverSetup);
                options.append(list_item);
            }
            var collapse = $('<div id="mms-active-' + code + '-select' + i + '" class="collapse show"/>');
            collapse.on('hide.bs.collapse', function () {
                $(this).find('.result-course').popover('hide');
            });
            collapse.append(options);
            select.append(collapse);
            collapsible.append(select);
        }
    }
    new_mms.append(card_header);
    new_mms.append(collapsible);
    mms_active_list.append(new_mms);
    active_mms[code] = new_mms;
    $(this).attr("disabled", true);
    $(this).text('Already in Plan');
}

function deleteMMS(button) {
    const code = $(button).parent().find('.mms-code').text();
    delete active_mms[code];
    $(button).parents('.mms').find('.result-course').popover('dispose');
    $(button).parents('.mms').remove()
}

function closePopover(button) {
    var code = $(button).parents('.popover').attr('data-code');
    if (code === undefined) code = button.previousSibling.textContent;
    $('.popover-region').find('.result-course, .result-mms').each(function () {
        if ($(this).find('.course-code').text() === code ||
            $(this).find('.mms-code').text() === code) {
            $(this).popover('hide');
        }
    })
}

function inDegree(code) {
    for (var session in degree_plan) {
        const courses = degree_plan[session];
        for (var c in courses) {
            if (code === courses[c]['code']) return true;
        }
    }
    return false;
}

function numInDegree(codes) {
    var count = 0;
    for (var session in degree_plan) {
        const courses = degree_plan[session];
        for (var c in courses) {
            const code = courses[c]['code'];
            if (codes.delete(code)) count++;
        }
    }
    return count;
}

function matchInDegree(codes) {
    let matches = new Set();
    for (let session in degree_plan) {
        const courses = degree_plan[session];
        for (let c of courses) {
            if (codes.delete(c['code'])) matches.add(c['code']);
        }
    }
    return matches;
}

function updateMMS() {
    for (let code in active_mms) {
        let mms_completed = true;
        let mms_units = 0;

        const mms_panel = active_mms[code];
        const mms_data = mms_info[code];
        const composition = mms_data['composition'];
        for (let section in composition) {
            const rule = composition[section];
            if (rule.type === 'fixed') {
                const matches = matchInDegree(new Set(rule.course.map(x => x.code)));
                for (let c of rule.course) if (matches.has(c.code)) mms_units += c.units;
                for (let c of mms_panel.find('.mms-required .result-course')) {
                    if (matches.has($(c).find('.course-code').text())) {
                        $(c).removeClass('exc').addClass('inc');
                    } else $(c).removeClass('inc').addClass('exc');
                }
                mms_completed = mms_completed && (matches.length === rule.course.length);

            } else if (rule.type === 'minimum') {
                let section_units = 0;
                const matches = matchInDegree(new Set(rule.course.map(x => x.code)));
                for (let c of rule.course) {
                    if (matches.has(c.code)) {
                        mms_units += c.units;
                        section_units += c.units;
                    }
                }
                const collapse = mms_panel.find('#mms-active-'+code+'-select'+section);
                for (let c of collapse.find('.result-course')) {
                    if (matches.has($(c).find('.course-code').text())) $(c).addClass('inc');
                    else $(c).removeClass('inc');
                }
                const unit_count = $(collapse.previousElementSibling).find('.unit-count');
                const unit_target = parseInt(unit_count.text().split('/')[1]);
                unit_count.text(section_units+'/'+unit_target);
                if (section_units >= unit_target) {
                    collapse.parent().removeClass('alert-warning');
                    collapse.parent().addClass('alert-success');
                } else {
                    collapse.parent().removeClass('alert-success');
                    collapse.parent().addClass('alert-warning');
                }

            } else if (rule.type === 'maximum') {

            }
        }

    }
}
