/**
 * Created by Joseph Meltzer on 25/04/18.
 */
const ELECTIVE_TEXT = "Elective Course";

let degree_plan = {};

$.ajax({
    url: 'degree/degreeplan',
    data: {
        'query': degree_code,
        'start_year_sem': start_year + 'S' + start_sem
    },
    success: function (data) {
        const title_text = degree_name + " starting " + start_year + " Semester " + start_sem;
        let title_box = $('#degree-title');
        title_box.prepend(title_text);
        title_box.hover(function () {
            $('#edit-button').fadeIn(150);
        }, function () {
            $('#edit-button').fadeOut(150);
        });

        let tab_index_count = 4;
        let grid = $('#plan-grid');
        let course_dict = data["response"];
        let titles_to_retrieve = {};
        for (let i in course_dict) {
            for (let session in course_dict[i]) {
                if (course_dict[i].hasOwnProperty(session)) {
                    degree_plan[session] = [];
                    const year = session.split('S')[0];
                    const sem = session.split('S')[1];
                    let first_cell = '<div class="first-cell">' +
                        '<div class="row-year h4">' + year + '</div>' +
                        '<div class="row-sem h5">Semester ' + sem + '</div>' +
                        '</div>';
                    let row = $('<div class="plan-row"/>');
                    row.append(first_cell);
                    const course_list = course_dict[i][session];
                    for (let course of course_list) {
                        degree_plan[session].push(course);
                        let cell = $('<div class="plan-cell result-course" tabindex="' + tab_index_count + '"/>');
                        tab_index_count++;
                        let title_node = $('<span class="course-title"/>');
                    if (false && course['title'] !== undefined) {   // Ignore the degree's own titles for now
                            title_node.text(course['title']);
                        } else if (course.code !== ELECTIVE_TEXT) {
                            if (!(course.code in titles_to_retrieve)) titles_to_retrieve[course.code] = [];
                            titles_to_retrieve[course.code].push(title_node);
                        }
                        cell.append('<div class="course-code">' + course['code'] + '</div>');
                        cell.append(title_node);
                        cell.click(clickCell);
                        cell.each(coursePopoverSetup);
                        if (course['code'] === ELECTIVE_TEXT) cell.droppable({
                            accept: '.draggable-course',
                            drop: function (event, ui) {
                                const first_cell = $(event.target.parentElement.firstElementChild);
                                const code = ui.draggable.find('.course-code').text();
                                const title = ui.draggable.find('.course-title').text();
                                const session = first_cell.find('.row-year').text() + 'S' + first_cell.find('.row-sem').text().split(' ')[1];
                                const position = $(event.target).index() - 1;
                                addCourse(code, title, session, position);
                            }
                        });
                        row.append(cell);
                    }
                    row.sortable({
                        items: "> .plan-cell"
                    });
                    grid.append(row);
                }
            }
        }
        if (!jQuery.isEmptyObject(titles_to_retrieve)) {
            $.ajax({
                'url': 'degree/coursedata',
                data: {
                    'query': 'titles',
                    'codes': JSON.stringify(Object.keys(titles_to_retrieve))
                },
                success: function (data) {
                    for (let course of data.response) {
                        course_titles[course['course_code']] = course['title'];
                        for (node of titles_to_retrieve[course['course_code']]) {
                            node.text(course['title']);
                        }
                    }
                }
            });
        }
    }
});

function coursePopoverSetup() {
    const code = $(this).find('.course-code').text();
    if (code === ELECTIVE_TEXT) return;
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
    const me = this;
    $(this).parents('.popover-region').find('.result-course, .result-mms').each(function () {
        if (this != me) $(this).popover('hide');
    });
    let popover = $(this).data('bs.popover');
    if (popover['data-received'] || false) return;
    let curr_popover = $(popover.tip);
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
            const truncated_description = data.response['description'].slice(0, 350) + '...';
            const html = '<h6 class="mt-2">Description</h6>\n' +
                '<div class="result-description">' + truncated_description + '</div>\n' +
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
    $(this).parents('.popover-region').find('.result-course, .result-mms').each(function () {
        if ($(this).find('.mms-code').text() !== code) {
            $(this).popover('hide');
        }
    });
    let popover = $(this).data('bs.popover');
    let curr_popover = $(popover.tip);
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
        let first_cell = $(this).parent().find('.first-cell');
        const year = first_cell.find('.row-year').text();
        const sem = first_cell.find('.row-sem').text();
        const badge_text = 'My ' + year + ' ' + sem;
        if (current_filters.has(badge_text)) {
            return;
        }
        let filter_icon = $('<span class="badge badge-primary">' + badge_text +
            '</span>');
        let delete_button = $('<a class="filter-delete">×</a>');
        delete_button.click(deleteFilter);
        filter_icon.append(delete_button);
        $('#filter-icons').append(filter_icon, ' ');
        current_filters.add(badge_text);
    }
}

let curr_requests = {'course': null, 'major': null, 'minor': null, 'spec': null};

$('#add-course').on('keyup', function () {
    for (let req of Object.values(curr_requests)) if (req !== null) req.abort();
    curr_requests['course'] = $.ajax({
        url: 'search?query=' + $(this).val(),
        type: 'GET',
        dataType: 'json',
        contentType: 'application/json',
        beforeSend: function () {
            let resultsList = $('#search-results-list');
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
    let responses = data['responses'];
    let body = $(section.find('.card-body'));

    body.find('.result-mms').popover('dispose');
    body.empty();
    if (responses.length > 0) {
        for (let r of responses) {
            const code = r['code'];
            const name = r['name'];
            let item = $(
                '<div class="draggable-course result-mms list-group-item list-group-item-action">\n    ' +
                '<span class="mms-code">' + code + '</span>' +
                '<span class="mms-name">' + name + '</span>\n' +
                '</div>');
            item.each(mmsPopoverSetup);
            body.append(item);
        }
    } else body.append('<div class="m-2">No ' + type + 's found.</div>');
    section.parent().find('.fa-refresh').css({'display': 'none'});
    section.parent().find('.collapse').css({'display': ''});
    section.collapse('show');
    console.log(type + ' search successful')
}

function updateCourseSearchResults(data) {
    const response = data['response'];
    let results = $('#results-courses');
    let cbody = $(results.find('.card-body'));

    cbody.find('.result-course').popover('dispose');
    cbody.empty();
    if (response.length > 0) {
        for (let r of response) {
            const code = r['code'];
            const title = r['title'];
            let item = $(
                '<div class="draggable-course result-course list-group-item list-group-item-action">\n    ' +
                '<span class="course-code">' + code + '</span>\n    ' +
                '<span class="course-title">' + title + '</span>\n' +
                '</div>');
            item.draggable({
                zIndex: 1000,
                revert: true,
                stop: function (event, ui) {
                    $(event.toElement).one('click', function (e) {
                        e.stopImmediatePropagation();
                    });
                }
            });
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

let mms_info = {};
let active_mms = {};
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
let course_titles = {};

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
    let mms_active_list = $('#mms-active-list');
    let new_mms = $('<div class="mms card"/>');
    let card_header = $(
        '<div class="card-header btn text-left pl-2" data-toggle="collapse" data-target="#mms-active-' + code + '">\n' +
        '    <span class="mms-code">' + code + '</span>\n' +
        '    <strong>' + mms_abbrev[type] + '</strong>: ' + mms_data['name'] + '\n' +
        '    <button class="mms-delete btn btn-danger" onclick="deleteMMS(this)">×</button>\n' +
        '    <span class="unit-count mr-2">0/' + mms_units[type] + '</span>\n' +
        '</div>');
    let collapsible = $(
        '<div id="mms-active-' + code + '" class="collapse show">' +
        '</div>'
    );
    collapsible.on('hide.bs.collapse', function () {
        $(this).find('.result-course').popover('hide');
    });
    collapsible.sortable({
        items: "> .mms-select-min, .mms-select-max"
    });

    for (let i in mms_data['composition']) {
        let value = mms_data['composition'][i];
        let titles_to_retrieve = {};
        if (value.type === "fixed") {
            let required = $('<div class="mms-required list-group list-group-flush"/>');
            for (let course of value.course) {
                let title_node = $('<span class="course-title"/>');
                if (course.code in course_titles) {
                    title_node.text(course_titles[course.code]);
                } else {
                    if (!(course.code in titles_to_retrieve)) titles_to_retrieve[course.code] = [];
                    titles_to_retrieve[course.code].push(title_node);
                }
                let item = $(
                    '<div class="list-group-item list-group-item-action draggable-course result-course">' +
                    '    <span class="course-code">' + course.code + '</span> ' +
                    '</div>'
                );
                item.append(title_node);
                item.draggable({
                    zIndex: 1000,
                    revert: true,
                    stop: function (event, ui) {
                        $(event.toElement).one('click', function (e) {
                            e.stopImmediatePropagation();
                        });
                    }
                });
                item.each(coursePopoverSetup);
                required.append(item);
            }
            collapsible.append(required);
        } else if (['minimum', 'maximum'].indexOf(value.type) >= 0) {
            let label_text = 'at least ';
            if (value.type === 'maximum') label_text = 'up to ';
            let select = $(
                '<div class="mms-select-' + value.type.slice(0, 3) + ' card">\n' +
                '    <div class="card-header btn text-left pl-2" data-toggle="collapse"\n' +
                '         data-target="#mms-active-' + code + '-select' + i + '">\n' +
                '        Choose ' + label_text + value.units + ' units\n' +
                '        <span class="unit-count mr-2">0/' + value.units + '</span>\n' +
                '    </div>\n' +
                '</div>');
            if (value.type === 'maximum') select.addClass('alert-success');
            let options = $('<div class="mms-optional list-group list-group-flush"/>');
            for (let course of value.course) {
                let title_node = $('<span class="course-title"/>');
                if (course.code in course_titles) {
                    title_node.text(course_titles[course.code]);
                } else {
                    if (!(course.code in titles_to_retrieve)) titles_to_retrieve[course.code] = [];
                    titles_to_retrieve[course.code].push(title_node);
                }
                let list_item = $(
                    '<div class="list-group-item list-group-item-action draggable-course result-course">' +
                    '    <span class="course-code">' + course.code + '</span> ' +
                    '</div>'
                );
                list_item.append(title_node);
                list_item.draggable({
                    zIndex: 1000,
                    revert: true,
                    stop: function (event, ui) {
                        $(event.toElement).one('click', function (e) {
                            e.stopImmediatePropagation();
                        });
                    }
                });
                list_item.each(coursePopoverSetup);
                options.append(list_item);
            }

            let collapse = $('<div id="mms-active-' + code + '-select' + i + '" class="collapse show"/>');
            collapse.on('hide.bs.collapse', function () {
                $(this).find('.result-course').popover('hide');
            });
            collapse.append(options);
            select.append(collapse);
            collapsible.append(select);
        }
        if (!jQuery.isEmptyObject(titles_to_retrieve)) {
            $.ajax({
                'url': 'degree/coursedata',
                data: {
                    'query': 'titles',
                    'codes': JSON.stringify(Object.keys(titles_to_retrieve))
                },
                success: function (data) {
                    for (let course of data.response) {
                        course_titles[course['course_code']] = course['title'];
                        for (node of titles_to_retrieve[course['course_code']]) {
                            node.text(course['title']);
                        }
                    }
                }
            });
        }
    }
    new_mms.append(card_header);
    new_mms.append(collapsible);
    mms_active_list.append(new_mms);
    active_mms[code] = new_mms;
    $(this).attr("disabled", true);
    $(this).text('Already in Plan');
    updateMMS();
}

function deleteMMS(button) {
    const code = $(button).parent().find('.mms-code').text();
    delete active_mms[code];
    $(button).parents('.mms').find('.result-course').popover('dispose');
    $(button).parents('.mms').remove()
}

function closePopover(button) {
    let code = $(button).parents('.popover').attr('data-code');
    if (code === undefined) code = button.previousSibling.textContent;
    $('.popover-region').find('.result-course, .result-mms').each(function () {
        if ($(this).find('.course-code').text() === code ||
            $(this).find('.mms-code').text() === code) {
            $(this).popover('hide');
        }
    })
}

function inDegree(code) {
    for (let session in degree_plan) {
        const courses = degree_plan[session];
        for (let course of courses) {
            if (code === course.code) return true;
        }
    }
    return false;
}

function numInDegree(codes) {
    let count = 0;
    for (let session in degree_plan) {
        const courses = degree_plan[session];
        for (let course of courses) {
            const code = course['code'];
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
                mms_completed = mms_completed && (matches.size === rule.course.length);

            }
            else if (rule.type === 'minimum') {
                let section_units = 0;
                const matches = matchInDegree(new Set(rule.course.map(x => x.code)));
                for (let c of rule.course) {
                    if (matches.has(c.code)) {
                        mms_units += c.units;
                        section_units += c.units;
                    }
                }
                const collapse = mms_panel.find('#mms-active-' + code + '-select' + section);
                for (let c of collapse.find('.result-course')) {
                    if (matches.has($(c).find('.course-code').text())) $(c).addClass('inc');
                    else $(c).removeClass('inc');
                }
                const unit_count = $(collapse[0].previousElementSibling).find('.unit-count');
                const unit_target = parseInt(unit_count.text().split('/')[1]);
                unit_count.text(section_units + '/' + unit_target);
                if (section_units >= unit_target) {
                    collapse.parent().removeClass('alert-warning');
                    collapse.parent().addClass('alert-success');
                } else {
                    collapse.parent().removeClass('alert-success');
                    collapse.parent().addClass('alert-warning');
                }
                mms_completed = mms_completed && (section_units >= unit_target);

            } else if (rule.type === 'maximum') {
                let section_units = 0;
                const matches = matchInDegree(new Set(rule.course.map(x => x.code)));
                for (let c of rule.course) {
                    if (matches.has(c.code)) {
                        section_units += c.units;
                    }
                }
                const collapse = mms_panel.find('#mms-active-' + code + '-select' + section);
                for (let c of collapse.find('.result-course')) {
                    if (matches.has($(c).find('.course-code').text())) $(c).addClass('inc');
                    else $(c).removeClass('inc');
                }
                const unit_count = $(collapse[0].previousElementSibling).find('.unit-count');
                const unit_target = parseInt(unit_count.text().split('/')[1]);
                unit_count.text(section_units + '/' + unit_target);
                mms_units += Math.min(section_units, unit_target);
            }
        }
        const unit_count = $(mms_panel.children()[0]).find('.unit-count');
        const unit_target = parseInt(unit_count.text().split('/')[1]);
        unit_count.text(mms_units + '/' + unit_target);
        mms_completed = mms_completed && mms_units >= unit_target;
        if (mms_completed) {
            mms_panel.removeClass('alert-warning');
            mms_panel.addClass('alert-success');
        } else {
            mms_panel.removeClass('alert-success');
            mms_panel.addClass('alert-warning');
        }
    }
}

function addCourse(code, title, session, position) {
    let slot = degree_plan[session][position];
    if (slot['code'] !== ELECTIVE_TEXT) return false;
    slot['code'] = code;
    slot['title'] = title;
    const year = session.split('S')[0];
    const sem = 'Semester ' + session.split('S')[1];
    const row = $('#plan-grid').find('.plan-row').filter(function () {
        const first_cell = $(this.children[0]);
        return (first_cell.find('.row-year').text() == year && first_cell.find('.row-sem').text() == sem);
    });
    const box = row.children()[position + 1];
    $(box).find('.course-code').text(code);
    $(box).find('.course-title').text(title);
    $(box).each(coursePopoverSetup);
    updateMMS();
}

$('#mms-active-list').sortable();


function validSessions(prerequisites) {
    let valid_sessions = new Set();

    let courses_taken = new Set();
    let courses_taking = new Set();

    for (let session in degree_plan) {
        s_courses = degree_plan[session];
        for (let course of s_courses) {
            if (course.code !== ELECTIVE_TEXT) courses_taking.add(course.code);
        }
        prereq_sat = true;
        for (let clause of prerequisites) {
            let clause_sat = false;
            for (let course of clause) {
                if (course.charAt(0) === '~') {
                    clause_sat = clause_sat || !(courses_taken.has(course) || courses_taking.has(course))
                } else clause_sat = clause_sat || courses_taken.has(course);
            }
            if (!clause_sat) {
                prereq_sat = false;
                break;
            }
        }
        if (prereq_sat) valid_sessions.add(session);
        courses_taking.forEach(courses_taken.add, courses_taken);
        courses_taking.clear()
    }
    return valid_sessions;
}

function highlightInvalidSessions(prerequisites) {

}