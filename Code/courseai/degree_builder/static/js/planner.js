/**
 * Created by Joseph Meltzer on 25/04/18.
 */
const ELECTIVE_TEXT = "Elective Course";

let degree_plan = {};
let degree_requirements = {};
let courses_force_added = {};

const title_text = degree_name + " starting " + start_year + " Semester " + start_sem;
$('#degree-title-text').text(title_text);
let title_box = $('#degree-title');
let rc_button = $('#rc-button');
title_box.hover(function () {
    rc_button.fadeIn(150);
}, function () {
    rc_button.fadeOut(150);
});

rc_button.click(function () {
    $('#rc-modal').modal();
});


$('#upload-button').click(function () {
    $('#upload-modal').modal();
});

$('#confirm-upload-button').click(function () {
    $.ajax({
        type: 'PUT',
        url: 'degree/degreeplan',
        data: JSON.stringify({
            "code": degree_code,
            "courses": preparePlanForUpload(degree_plan)
        }),
        headers: {
            "Content-Type": "application/json"
        },
        success: function () {
            $('#degree-submit-success').removeClass('d-none');
        },
        error: function () {
            $('#degree-title').after('<div class="alert alert-danger alert-dismissible fade show mx-auto mb-0" role="alert">\n' +
                '  Could not submit degree plan. Please try again. \n' +
                '  <button type="button" class="close" data-dismiss="alert" aria-label="Close">\n' +
                '    <span aria-hidden="true">&times;</span>\n' +
                '  </button>\n' +
                '</div>');
        }
    })
});

$('#degree-submit-success').find('button.close').click(function () {
    $('#degree-submit-success').addClass('d-none');
});

function preparePlanForUpload(plan) {
    to_return = [];
    for (var session in plan) {
        to_add = {};
        to_add[session] = plan[session];
        to_return.push(to_add);
    }
    return to_return
}

function clearAllCourses() {
    for (let session in degree_plan) {
        for (let pos in degree_plan[session]) {
            let slot = degree_plan[session][pos];
            delete courses_force_added[slot.code];
            slot['code'] = ELECTIVE_TEXT;
            delete slot['title'];
        }
    }
    for (let box of $('#plan-grid').find('.plan-cell')) {
        $(box).popover('dispose');
        makeSlotDroppable($(box));
        $(box).find('.course-code').text(ELECTIVE_TEXT);
        $(box).find('.course-title').text('');
    }
    updateForceNotice();
    updateProgress();
}

$('#confirm-clear-button').click(clearAllCourses);

$('#confirm-reset-button').click(function () {
    $.ajax({
        url: 'degree/degreeplan',
        data: {
            'query': degree_code,
            'start_year_sem': start_year + 'S' + start_sem
        },
        success: function (data) {
            clearAllCourses();
            let course_dict = data['response'];
            for (let row of course_dict) {
                let session = Object.keys(row)[0];
                let courses = row[session];
                for (let i in courses) {
                    let c = courses[i];
                    addCourse(c.code, course_titles[c.code], session, parseInt(i), false);
                }
            }
            updateRecommendations();
        }
    });
});

$.ajax({
    url: 'degree/degreeplan',
    data: {
        'query': degree_code,
        'start_year_sem': start_year + 'S' + start_sem
    },
    success: function (data) {
        let tab_index_count = 5;
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
                    if (sem == '1') row.addClass('mt-3');
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
                        if (course['code'] === ELECTIVE_TEXT) makeSlotDroppable(cell);
                        row.append(cell);
                    }
                    row.sortable({
                        items: "> .plan-cell",
                        start: function (event, ui) {
                            if (ui.item.find('.course-code').text() === ELECTIVE_TEXT) return;
                            const first_cell = $(event.target).find('.first-cell');
                            first_cell.children().css({'display': 'none'});
                            first_cell.addClass('delete').addClass('alert-danger');
                            first_cell.append('<div class="course-delete mx-auto my-auto text-center" style="font-weight: bold;">\n' +
                                '    <i class="fas fa-trash-alt" aria-hidden="true" style="font-size: 32pt;"></i>\n' +
                                '    <div class="mt-2">Remove</div>\n' +
                                '</div>');
                            first_cell.droppable({
                                accept: '.plan-cell',
                                drop: function (event, ui) {
                                    console.log('delete');
                                    const session = first_cell.find('.row-year').text() + 'S' + first_cell.find('.row-sem').text().split(' ')[1];
                                    const position = ui.draggable.index();
                                    // let position = -1;
                                    // for (let cell of ui.draggable.parent().children()) {
                                    //     if (cell == ui.draggable[0]) break;
                                    //     if (!$(cell).hasClass('ui-sortable-placeholder')) position += 1;
                                    // }
                                    // if (ui.draggable.parent().find('.ui-sortable-placeholder').index() - 1 < position) position--;
                                    removeCourse(session, position);
                                    first_cell.droppable('destroy');
                                    first_cell.children().last().remove();
                                    first_cell.removeClass('delete').removeClass('alert-danger');
                                    first_cell.children().css({'display': 'block'});
                                }
                            })
                        },
                        stop: function (event, ui) {
                            const first_cell = $(event.target).find('.first-cell');
                            if (first_cell.hasClass('delete')) {
                                first_cell.droppable('destroy');
                                first_cell.children().last().remove();
                                first_cell.removeClass('delete').removeClass('alert-danger');
                                first_cell.children().css({'display': 'block'});
                            }

                            const session = first_cell.find('.row-year').text() + 'S' + first_cell.find('.row-sem').text().split(' ')[1];
                            for (let i in degree_plan[session]) {
                                let course_slot = degree_plan[session][i];
                                let cell = $(event.target.children[parseInt(i) + 1]);
                                course_slot['code'] = cell.find('.course-code').text();
                                course_slot['title'] = cell.find('.course-title').text();
                            }
                        }
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
                        for (let node of titles_to_retrieve[course['course_code']]) {
                            node.text(course['title']);
                            let popover = node.parents('.plan-cell').data('bs.popover');
                            let new_popover = $('<div>' + popover.config.content + '</div>');
                            new_popover.find('.result-title').text(course['title']);
                            popover.config.content = new_popover.html();
                        }
                    }
                    for (let session in degree_plan) {
                        let courses = degree_plan[session];
                        for (let c of courses) {
                            if (c.code in course_titles) c.title = course_titles[c.code];
                        }
                    }
                    updateProgress();
                    updateRecommendations();
                }
            });
        }
    }
});

function updateForceNotice() {
    let notice = $('#courses-forced-notice');
    let list = $('#courses-forced-list');
    if (Object.keys(courses_force_added).length > 0) notice.css({'display': 'block'});
    else notice.css({'display': ''});
    list.empty();
    let count = 0;
    for (let course in courses_force_added) {
        if (count !== 0) list.append(', ');
        let link = $('<a class="course-highlighter" href="javascript:void(0)">' + course + '</a>');
        link.click(function () {
            courses_force_added[course].animate({boxShadow: '0 0 25px #007bff'});
            courses_force_added[course].animate({boxShadow: ''});
        });
        list.append(link);
        count++;
    }
}

function electiveDropped(event, ui) {
    const row = event.target.parentElement;
    const first_cell = $(row.firstElementChild);
    const code = ui.draggable.find('.course-code').text();
    const title = ui.draggable.find('.course-title').text();
    const session = first_cell.find('.row-year').text() + 'S' + first_cell.find('.row-sem').text().split(' ')[1];
    const position = $(event.target).index() - 1;
    if ($(row).hasClass('unavailable')) {
        const reason = $(first_cell[0].lastElementChild).text();
        let modal;
        if (reason === "Prerequisites not met") {
            $('#prereq-modal-course').text(ui.draggable.find('.course-code').text());
            modal = $('#prereq-modal');
        } else if (reason.includes('Incompatible')) {
            $('#incompat-course1').text(ui.draggable.find('.course-code').text());
            $('#incompat-course2').text(reason.split(' ').pop());
            modal = $('#incompat-modal');
        } else if (reason === "Not available in this semester") {
            $('#unavail-modal-course').text(ui.draggable.find('.course-code').text());
            modal = $('#unavail-modal');
        }
        let override_button = modal.find('#course-add-override');
        override_button.off('click');
        override_button.click(function () {
            addCourse(code, title, session, position);
            courses_force_added[code] = $(event.target);
            updateForceNotice();
        });
        modal.modal();
        return
    }
    addCourse(code, title, session, position);
}

let course_data = {};
let course_lists = {};

function coursePopoverSetup(i, item) {
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
        '    <a href="https://programsandcourses.anu.edu.au/course/' + code +
        '     " class="h6 popover-footer text-center d-block" target="_blank">See More on Programs and Courses</a>\n' +
        '</div>'
    });
    $(this).on('show.bs.popover', function () {
        coursePopoverData(this, $(item).hasClass('plan-cell'));
    })


}

function coursePopoverData(course, descriptionOnly = false) {
    const code = $(course).find('.course-code').text();
    const me = course;
    $(course).parents('.popover-region').find('.result-course, .result-mms').each(function () {
        if (this != me) $(this).popover('hide');
    });
    let popover = $(course).data('bs.popover');
    if (popover['data-received'] || false) return;
    let curr_popover = $(popover.tip);
    let coursedata_request = $.ajax({
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
            course_data[code] = data.response;
            let html = '';
            if (![undefined, 'nan'].includes(data.response['description'])) {
                const truncated_description = data.response['description'].slice(0, 350) + '...';
                html += '<h6 class="mt-2">Description</h6>\n' +
                    '<div class="result-description">' + truncated_description + '</div>\n';
            }
            if (!descriptionOnly) {
                const semesters = data.response['semester'];
                if (![undefined, 'nan'].includes(semesters)) {
                    if (semesters.length == 0) html += '<h6 class="mt-2">Not available in standard semesters</h6>';
                    else if (semesters.length == 2) html += '<h6 class="mt-2">Available in both semesters</h6>';
                    else html += '<h6 class="mt-2">Available in Semester ' + semesters[0] + '</h6>';
                }

                if (![undefined, 'nan'].includes(data.response['prerequisite_text'])) {
                    html += '<h6 class="mt-2">Prerequisites and Incompatibility</h6>\n' +
                        '<div class="result-description">' + data.response['prerequisite_text'] + '</div>\n';
                }
            }
            html += '<h6 class="mt-2">Related Courses</h6>\n' +
                '<div class="related-courses list-group"></div>';
            popover.config.content = $(popover.config.content).first().prop('outerHTML');
            popover.config.content += html;
            curr_popover.find('.fa-refresh').css({'display': 'none'});
            curr_popover.find('.popover-body').append(html);
            popover['data-received'] = true;
        },
        error: function () {
            console.log('Error retrieving data for ' + code)
        }
    });
    const first_cell = $(course.parentElement.firstElementChild);
    let session = "2018S1"; // Placeholder session for courses which are not in the degree plan.
    if (first_cell.hasClass('first-cell')) {
        session = first_cell.find('.row-year').text() + 'S' + first_cell.find('.row-sem').text().split(' ')[1];
    }
    let course_dict = {};
    course_dict[session] = [{"code": code}];
    $.ajax({
        url: 'search/recommend',
        data: {
            'code': degree_code,
            'courses': JSON.stringify([course_dict])
        },
        success: function (data) {
            $.when(coursedata_request).done(function (response) {
                let titles_to_retrieve = {};
                let group = curr_popover.find('.related-courses');
                for (const course of data.response) {
                    const code = course.course;
                    const reason = course.reasoning;

                    let item = $(
                        '<div class="draggable-course result-course list-group-item list-group-item-action">\n' +
                        '    <span class="course-code">' + code + '</span>\n' +
                        '</div>\n');
                    let title_node = $('<span class="course-title"></span>');
                    if (code in course_titles) title_node.text(course_titles[code]);
                    else {
                        if (!(code in titles_to_retrieve)) titles_to_retrieve[code] = [];
                        titles_to_retrieve[code].push(title_node);
                    }
                    item.append(title_node);
                    item.append('<div class="course-reason">' + reason + '</div>');
                    makeCourseDraggable(item, code);
                    item.each(coursePopoverSetup);
                    group.append(item);
                }
                let title_retrieval;
                if (!jQuery.isEmptyObject(titles_to_retrieve)) {
                    title_retrieval = $.ajax({
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
                                    let popover = node.parents('.result-course').data('bs.popover');
                                    const new_content = $($(popover.config.content)[0]).text(course['title']);
                                    popover.config.content = new_content.prop('outerHTML');
                                }
                            }
                        }
                    });
                    $.when(title_retrieval).done(function () {
                        let popover_content = $('<div>' + popover.config.content + '</div>');
                        popover_content.find('.related-courses').replaceWith(group.clone());
                        popover.config.content = popover_content.html();
                    });
                } else {
                    let popover_content = $('<div>' + popover.config.content + '</div>');
                    popover_content.find('.related-courses').replaceWith(group.clone());
                    popover.config.content = popover_content.html();
                }
            });
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
        '    <a href="https://programsandcourses.anu.edu.au/' + mms_abbrev[code.split('-')[1]].toLowerCase() + '/' + code +
        '     " class="h6 popover-footer text-center d-block" target="_blank">See More on Programs and Courses</a>\n' +
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
            const composition = $('<div class="result-composition"/>');

            for (let section of data['composition']) {
                if (section.course.length === 0) continue;
                const comp_section = $('<div class="mms-comp-section"/>');
                const label = $('<div class="mms-comp-label"/>');
                if (section.type === 'fixed') label.text('Compulsory: ');
                if (section.type === 'minimum') label.text('At least ' + section.units + ' units: ');
                if (section.type === 'maximum') label.text('Up to ' + section.units + ' units: ');
                const group = $('<div class="list-group"/>');
                for (let course of section.course) {
                    group.append('<div class="list-group-item">' +
                        '<span class="course-code">' + course.code + '</span>' +
                        '<span class="course-title"> ' + '' + '</span>' +
                        '</div>');
                }
                comp_section.append(label);
                comp_section.append(group);
                composition.append(comp_section);
            }

            const html = '<h6 class="mt-2">Study Requirements</h6>\n' + composition.prop('outerHTML');
            popover.config.content = html;
            curr_popover.find('.fa-refresh').css({'display': 'none'});
            curr_popover.find('.popover-body').append(html);
            popover['data-received'] = true;
            $('.mms-add button').click(mms_click_add);
        },
        error: function () {
            console.log('Error retrieving data for' + code);
        }
    });
}

function clickCell() {
    if ($(this).find('.course-code').text() === ELECTIVE_TEXT) {
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
        search(true);
    }
}

let curr_requests = {'course': null, 'major': null, 'minor': null, 'spec': null};

function search(coursesOnly = false) {
    if (coursesOnly && curr_requests['course'] !== null) curr_requests['course'].abort();
    else for (let req of Object.values(curr_requests)) if (req !== null) req.abort();
    let filters = {
        'codes': [],
        'levels': [],
        'semesters': [],
    };
    for (let filter of current_filters) {
        if (!isNaN(parseInt(filter))) filters.levels.push(parseInt(filter));
        else if (filter.length === 4) filters.codes.push(filter);
        else {
            const sem = parseInt(filter.split(' ')[3]);
            if (!filters['semesters'].includes(sem)) filters['semesters'].push(sem);
        }
    }
    console.log(filters);

    const searchValue = $('#add-course').val();
    const resultsList = $('#search-results-list');
    resultsList.find('.result-course').popover('hide');

    curr_requests['course'] = $.ajax({
        url: 'search/coursesearch',
        data: {
            'query': searchValue,
            'filters': JSON.stringify(filters)
        },
        type: 'GET',
        dataType: 'json',
        contentType: 'application/json',
        beforeSend: function () {
            const courseResultsList = resultsList.children().first();
            courseResultsList.find('.collapse').css({'display': 'none'});
            courseResultsList.find('.fa-refresh').css({'display': 'inline-block'});
        },
        success: updateCourseSearchResults,
        error: console.log('Course search aborted or failed. '),
        complete: console.log('Course search initiated. ')
    });
    if (coursesOnly) return;
    resultsList.find('.collapse').css({'display': 'none'});
    resultsList.find('.fa-refresh').css({'display': 'inline-block'});

    curr_requests['major'] = $.ajax({
        url: 'degree/majors?query=' + searchValue,
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
        url: 'degree/minors?query=' + searchValue,
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
        url: 'degree/specs?query=' + searchValue,
        type: 'GET',
        dataType: 'json',
        contentType: 'application/json',
        success: function (data) {
            updateMMSResults(data, 'specialisation', $('#results-specs'))
        },
        error: console.log('Specialisation search aborted or failed. '),
        complete: console.log('Specialisation search initiated. ')
    });
}

$('#add-course').on('keyup', function () {
    search()
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

function makeSlotDroppable(item) {
    item.droppable({
        accept: '.draggable-course',
        drop: function (event, ui) {
            item.removeClass('active-drop');
            const row = event.target.parentElement;
            const first_cell = $(row.firstElementChild);
            const code = ui.draggable.find('.course-code').text();
            const title = ui.draggable.find('.course-title').text();
            const session = first_cell.find('.row-year').text() + 'S' + first_cell.find('.row-sem').text().split(' ')[1];
            const position = $(event.target).index() - 1;
            if ($(row).hasClass('unavailable')) {
                const reason = $(first_cell[0].lastElementChild).text();
                let modal;
                if (reason === "Prerequisites not met") {
                    $('#prereq-modal-course').text(ui.draggable.find('.course-code').text());
                    modal = $('#prereq-modal');
                } else if (reason.includes('Incompatible')) {
                    $('#incompat-course1').text(ui.draggable.find('.course-code').text());
                    $('#incompat-course2').text(reason.split(' ').pop());
                    modal = $('#incompat-modal');
                } else if (reason === "Not available in this semester") {
                    $('#unavail-modal-course').text(ui.draggable.find('.course-code').text());
                    modal = $('#unavail-modal');
                }
                let override_button = modal.find('#course-add-override');
                override_button.off('click');
                override_button.click(function () {
                    addCourse(code, title, session, position);
                    courses_force_added[code] = $(event.target);
                    updateForceNotice();
                });
                modal.modal();
                return
            }
            addCourse(code, title, session, position);
        },
        over: function (event, ui) {
            item.addClass('active-drop');
        },
        out: function (event, ui) {
            item.removeClass('active-drop');
        }
    });
}

function makeCourseDraggable(item, code) {
    item.draggable({
        zIndex: 800,
        revert: true,
        helper: 'clone',
        start: function (event, ui) {
            highlightElectives();
            ui.helper.addClass('dragged-course');
            if (!(code in course_data)) {
                $.ajax({
                    url: 'degree/coursedata',
                    data: {'query': code},
                    success: function (data) {
                        course_data[code] = data.response;
                        highlightInvalidSessions(course_data[code]['prerequisites'], course_data[code]['semester']);

                    }
                })
            } else {
                highlightInvalidSessions(course_data[code]['prerequisites'], course_data[code]['semester']);
            }
        },
        stop: function (event, ui) {
            $(event.toElement).one('click', function (e) {
                e.stopImmediatePropagation();
            });
            removeSessionHighlights();
            clearElectiveHighlights();
        }
    });
}

function updateCourseSearchResults(data) {
    const response = data['response'];
    let results = $('#results-courses');
    let cbody = $(results.find('.card-body'));

    cbody.find('.result-course').popover('dispose');
    cbody.empty();

    function addResponses(responses) {
        if (responses.length > 0) {
            for (let r of responses.slice(0,10)) {
                const code = r['code'];
                const title = r['title'];
                course_titles[code] = title;
                let item = $(
                    '<div class="draggable-course result-course list-group-item list-group-item-action">\n    ' +
                    '<span class="course-code">' + code + '</span>\n    ' +
                    '<span class="course-title">' + title + '</span>\n' +
                    '</div>');
                makeCourseDraggable(item, code);
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

    if ([...current_filters].some(x => (x.length) > 4)) {
        $.ajax({
            url: 'degree/coursedata',
            data: {
                'query': 'prereqs',
                'codes': JSON.stringify(response.map(r => r.code))
            },
            success: function (data) {
                let valid_responses = [];
                const allowedSessions = [...current_filters].filter(x => (x.length) > 4).map(w => w.split(' ')[1] + 'S' + w.split(' ')[3]);
                for (let course of response) {
                    const code = course.code;
                    const prereqs = data.response[code]['prerequisites'];
                    const invalid = invalidSessions(prereqs);
                    if (allowedSessions.some(x => !(x in invalid))) valid_responses.push(course)
                }
                addResponses(valid_responses)
            }
        })
    } else addResponses(response);
}

$('.collapse').on('hide.bs.collapse', function () {
    $(this).find('.result-course').popover('hide');
});

$('#results-majors, #results-minors, #results-specs').on('hide.bs.collapse', function () {
    $(this).find('.result-mms').popover('hide');
});

const current_filters = new Set();
const filter_button = $('#show-filters');
filter_button.popover({
    trigger: 'click',
    title: 'Search Filters <a class="popover-close" onclick="closePopover(this)">×</a>',
    placement: 'right',
    html: true,
    // container: '#show-filters',
    content: '<form onsubmit="return filterSubmit(this)">\n' +
    '<div class="form-row" style="padding: 0 5px">' +
    '<label for="code-input">Filter course codes: </label></div>\n' +
    '<div class="form-row" style="padding: 0 5px">\n' +
    '    <div style="width: 100%; float:left; padding-right: 61px;"><input id="code-input" type="text" maxlength="4" class="form-control"></div>\n' +
    '    <button type="submit" class="btn btn-primary" style="float: left; margin-left: -56px;">Add</button>\n' +
    '</div>\n' +
    '<div class="form-row" style="padding: 0 5px"><label>Filter course level: </label></div>\n' +
    '<div class="form-row">\n' +
    '    <div class="col-3"><button class="btn btn-outline-primary btn-sm" onclick="addLevelFilter(\'1000\')">1000</button></div>\n' +
    '    <div class="col-3"><button class="btn btn-outline-primary btn-sm" onclick="addLevelFilter(\'2000\')">2000</button></div>\n' +
    '    <div class="col-3"><button class="btn btn-outline-primary btn-sm" onclick="addLevelFilter(\'3000\')">3000</button></div>\n' +
    '    <div class="col-3"><button class="btn btn-outline-primary btn-sm" onclick="addLevelFilter(\'4000\')">4000</button></div>\n' +
    '</div>\n' +
    '<div class="form-row mt-2" style="padding: 0 5px">Filter per semester by clicking any elective course in the plan. </div>\n' +
    '</form>' +
    '',
    template: '<div class="popover filters-panel" role="tooltip">\n' +
    '    <div class="arrow"></div>\n' +
    '    <div class="h3 popover-header"></div>\n' +
    '    <div class="popover-body"></div>\n' +
    '    <a href="javascript:void(0)" class="popover-footer btn-outline-secondary text-center" onclick="$(\'#show-filters\').popover(\'hide\')">Close</a>\n' +
    '</div>'
});

function filterSubmit(form) {
    const code = $(form).find('input[type=text]').val().toUpperCase();
    if (code) addCodeFilter(code);
    return false;
}

function deleteFilter() {
    current_filters.delete(this.previousSibling.textContent);
    $(this).parent().remove();
    search(true);
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

function mms_add(code) {
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
                makeCourseDraggable(item, course.code);
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
                makeCourseDraggable(list_item, course.code);
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
                            let popover = node.parents('.result-course').data('bs.popover');
                            const new_content = $($(popover.config.content)[0]).text(course['title']);
                            popover.config.content = new_content.prop('outerHTML');
                        }
                    }
                }
            });
        }
    }
    new_mms.append(card_header);
    new_mms.append(collapsible);
    mms_active_list.prepend(new_mms);
    active_mms[code] = new_mms;
    const collapse_button = $('.collapse-all');
    if (collapse_button.text()==='Collapse all') collapse_button.click();
    else $('#degree-reqs-list').find('.collapse').collapse('hide');
    $(this).attr("disabled", true);
    $(this).text('Already in Plan');
    updateProgress();
}

function mms_click_add() {
    const code = $(this).parents('.popover').attr('data-code');
    if (code in active_mms) {
        return
    }
    $('#search-results-list, #degree-reqs-list').find('.result-mms').each(function () {
        if ($(this).find('.mms-code').text() === code) {
            $(this).popover('hide');
        }
    });
    mms_add(code)
}

function deleteMMS(button) {
    const code = $(button).parent().find('.mms-code').text();
    delete active_mms[code];
    $(button).parents('.mms').find('.result-course').popover('dispose');
    $(button).parents('.mms').remove();
    updateProgress();
}

function closePopover(button) {
    $(button).parents('.popover').popover('hide');
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

function matchCategoryInDegree(codes, levels) {
    let matches = new Set();
    for (let session in degree_plan) {
        const courses = degree_plan[session];
        for (let c of courses) {
            let match = true;
            if (codes && codes.length > 0) {
                match = match && codes.includes(c.code.slice(0, 4));
            }
            if (levels && levels) {
                match = match && levels.includes(parseInt(c.code.charAt(4)) * 1000);
            }
            if (match) matches.add(c.code)
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

function addCourse(code, title, session, position, update_recommendations = true) {
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
    const box = $(row.children()[position + 1]);
    box.droppable('destroy');
    box.find('.course-code').text(code);
    box.find('.course-title').text(title);
    box.each(coursePopoverSetup);
    updateProgress();
    if (update_recommendations) updateRecommendations();
}

function removeCourse(session, position, update_recommendations = true) {
    const year = session.split('S')[0];
    const sem = 'Semester ' + session.split('S')[1];
    const row = $('#plan-grid').find('.plan-row').filter(function () {
        const first_cell = $(this.children[0]);
        return (first_cell.find('.row-year').text() == year && first_cell.find('.row-sem').text() == sem);
    });
    const box = $(row.children()[position]);
    if (box.prevAll().hasClass('ui-sortable-placeholder')) position--;
    let slot = degree_plan[session][position - 1];
    delete courses_force_added[slot['code']];
    updateForceNotice();
    slot['code'] = ELECTIVE_TEXT;
    delete slot['title'];
    box.popover('dispose');
    makeSlotDroppable(box);
    box.find('.course-code').text(ELECTIVE_TEXT);
    box.find('.course-title').text('');
    updateProgress();
    if (update_recommendations) updateRecommendations();
}

$('#mms-active-list').sortable();

function highlightElectives() {
    for (let cell of $('#plan-grid').find('.plan-cell')) {
        if ($(cell).find('.course-code').text() === ELECTIVE_TEXT) {
            $(cell).animate({'background-color': '#cde6d3'}, 200);
        }
    }
}

function clearElectiveHighlights() {
    for (let cell of $('#plan-grid').find('.plan-cell')) {
        $(cell).animate({'background-color': '#'}, 200);

    }
}


function invalidSessions(prerequisites, semesters = [1, 2]) {
    let invalid_sessions = {};

    let courses_taken = new Set();
    let courses_taking = new Set();

    if(semesters.length === 0) {semesters = [1, 2]};


    for (let session in degree_plan) {
        const sem = parseInt(session.split('S').pop());
        let prereq_fail_reason = "";
        let s_courses = degree_plan[session];
        for (let course of s_courses) {
            if (course.code !== ELECTIVE_TEXT) courses_taking.add(course.code);
        }

        if (!semesters.includes(sem)) {
            prereq_fail_reason = "Not available in this semester"
        } else {
            for (let clause of prerequisites) {
                let fail_reason = "";
                let clause_sat = false;
                for (let course of clause) {
                    if (course.charAt(0) === '~') {
                        if (courses_taken.has(course.slice(1)) || courses_taking.has(course.slice(1))) {
                            fail_reason = "Incompatible course: " + course.slice(1);
                        }
                        clause_sat = true;
                    } else clause_sat = clause_sat || courses_taken.has(course);
                }
                if (fail_reason) prereq_fail_reason = fail_reason;
                if (!clause_sat) {
                    prereq_fail_reason = "Prerequisites not met";
                    break;
                }
            }
        }

        if (prereq_fail_reason) invalid_sessions[session] = prereq_fail_reason;
        courses_taking.forEach(courses_taken.add, courses_taken);
        courses_taking.clear()
    }
    return invalid_sessions;
}

function highlightInvalidSessions(prerequisites, semesters) {
    const invalid_sessions = invalidSessions(prerequisites, semesters);

    for (let row of $('#plan-grid').find('.plan-row')) {
        const first_cell = $(row.children[0]);
        const session = first_cell.find('.row-year').text() + 'S' + first_cell.find('.row-sem').text().split(' ')[1];
        if (!(session in invalid_sessions)) continue;
        const reason = invalid_sessions[session];
        $(row).addClass('unavailable', {duration: 500});
        first_cell.addClass('d-flex');
        first_cell.children().css({'display': 'none'});
        first_cell.append('<div class="h6 mx-auto my-auto">' + reason + '</div>');
    }
}

function removeSessionHighlights() {
    for (let row of $('#plan-grid').find('.plan-row')) {
        if (!$(row).hasClass('unavailable')) continue;
        const first_cell = $(row.children[0]);
        $(row).removeClass('unavailable', {duration: 500});
        first_cell.removeClass('d-flex');
        first_cell.children().css({'display': 'block'});
        while (first_cell.children().length > 2) first_cell.children().last().remove();
    }
}

function addCodeFilter(code) {
    if (current_filters.has(code)) {
        return;
    }
    let filter_icon = $('<span class="badge badge-primary">' + code + '</span>');
    let delete_button = $('<a class="filter-delete">×</a>');
    delete_button.click(deleteFilter);
    filter_icon.append(delete_button);
    $('#filter-icons').append(filter_icon, ' ');
    current_filters.add(code);
    search(true);
}

function addLevelFilter(code) {
    if (current_filters.has("" + code)) {
        return;
    }
    let filter_icon = $('<span class="badge badge-primary">' + code + '</span>');
    let delete_button = $('<a class="filter-delete">×</a>');
    delete_button.click(deleteFilter);
    filter_icon.append(delete_button);
    $('#filter-icons').append(filter_icon, ' ');
    current_filters.add("" + code);
    search(true);
}

$('.collapse-all').click(function () {
    if (this.textContent === "Collapse all") {
        $('#degree-reqs-list').find('.collapse').collapse('hide');
        $(this).text("Expand all")
    } else if (this.textContent === 'Expand all') {
        $('#degree-reqs-list').find('.collapse').collapse('show');
        $(this).text("Collapse all")
    }
});

$.ajax({
    url: 'degree/degreereqs',
    data: {'query': degree_code},
    success: setupDegreeRequirements
});

function setupDegreeRequirements(data) {
    if (!data) return;
    degree_requirements = data;
    let reqs_list = $('#degree-reqs-list');
    reqs_list.sortable();
    let header = $('#degree-header');
    let unit_count = header.find('.unit-count');
    unit_count.text("0/" + data.units + " units");
    let titles_to_retrieve = {};
    let ajax_requests = [];
    let mms_to_retrieve = {};
    let mms_to_display = [];
    let section_count = 0;

    function createCourseListSection(type, title, courses, counter = section_count) {
        let section = $('<div class="deg card"/>');
        let card_header = $(
            '<div class="card-header btn text-left pl-2" data-toggle="collapse" data-target="#deg-section' + counter + '">\n' +
            '    <span class="requirement-type">' + type + '</span>\n' + title +
            '</div>'
        );
        let collapsible = $(
            '<div id="deg-section' + counter + '" class="collapse show"/>'
        );
        collapsible.on('hide.bs.collapse', function () {
            $(this).find('.result-course').popover('hide');
        });
        let group = $('<div class="list-group list-group-flush"/>');
        for (let course of courses) {
            let title_node = $('<span class="course-title"/>');
            if (course in course_titles) {
                title_node.text(course_titles[course])
            } else {
                if (!(course in titles_to_retrieve)) titles_to_retrieve[course] = [];
                titles_to_retrieve[course].push(title_node);
            }
            let item = $(
                '<div class="list-group-item list-group-item-action draggable-course result-course">' +
                '    <span class="course-code">' + course + '</span> ' +
                '</div>'
            );
            item.append(title_node);
            // item.each(coursePopoverSetup);
            makeCourseDraggable(item, course);
            group.append(item);
        }
        collapsible.append(group);
        section.append(card_header);
        section.append(collapsible);
        return section;
    }

    function createCourseCategorySection(type, title, codes, levels) {
        let section = $('<div class="deg card"/>');
        let card_header = $(
            '<div class="card-header btn text-left pl-2" data-toggle="collapse" data-target="#deg-section' + section_count + '">\n' +
            '    <span class="requirement-type">' + type + '</span>\n' + title +
            '</div>'
        );
        let collapsible = $(
            '<div id="deg-section' + section_count + '" class="collapse show"/>'
        );
        collapsible.on('hide.bs.collapse', function () {
            $(this).find('.result-course').popover('hide');
        });
        let description = '<div class="deg-category-description">From ';
        if (levels && levels.length > 0) {
            for (let i in levels) {
                if (i > 0) description += '/ ';
                description += '<a href="javascript:void(0)" class="level-filter" onclick="addLevelFilter(\'' + levels[i] + '\')">' + levels[i] + '</a> ';
            }
        }
        description += 'courses starting with: ';
        for (let i in codes) {
            if (i > 0) description += ', ';
            description += '<a href="javascript:void(0)" class="code-filter" onclick="addCodeFilter(\'' + codes[i] + '\')">' + codes[i] + '</a>';
        }
        description = $(description + '</div>');
        collapsible.append(description);
        collapsible.append($('<div class="list-group list-group-flush"/>'));
        section.append(card_header);
        section.append(collapsible);
        return section;
    }

    function createMMSListSection(type, title, mms) {
        let section = $('<div class="deg card"/>');
        let card_header = $(
            '<div class="card-header btn text-left pl-2" data-toggle="collapse" data-target="#deg-section' + section_count + '">\n' +
            '    <span class="requirement-type">' + type + '</span>\n' + title +
            '</div>'
        );
        let collapsible = $(
            '<div id="deg-section' + section_count + '" class="collapse show"/>'
        );
        collapsible.on('hide.bs.collapse', function () {
            $(this).find('.result-mms').popover('hide');
        });
        let group = $('<div class="list-group list-group-flush"/>');
        for (let code of mms) {
            let title_node = $('<span class="mms-name"/>');
            mms_to_retrieve[code] = title_node;
            let item = $(
                '<div class="list-group-item list-group-item-action result-mms">' +
                '    <span class="mms-code">' + code + '</span> ' +
                '</div>'
            );
            item.append(title_node);
            group.append(item);
        }
        collapsible.append(group);
        section.append(card_header);
        section.append(collapsible);
        return section;
    }

    for (let type in data.required) {
        if (type === "compulsory_courses") {
            let card = createCourseListSection(type, "Compulsory courses", data.required[type]);
            reqs_list.append(card);
            section_count++;
        }
        if (type === "one_from_here") {
            for (let section of data.required[type]) {
                let card = createCourseListSection(type, "Pick at least one", section);
                reqs_list.append(card);
                section_count++;
            }
        }
        if (type === "x_from_here") {
            for (let section of data.required[type]) {
                let title = 'Choose at least ' + section['num'] + ' units' +
                    '<span class="unit-count mr-2">0/' + section['num'] + '</span>\n';
                if (typeof(section['courses']) === "string") {
                    const name = section['courses'];
                    let placeholder = $('<div/>');
                    reqs_list.append(placeholder);
                    const original_section_count = section_count;
                    section_count++;
                    ajax_requests.push($.ajax({
                        url: 'degree/courselists',
                        data: {'query': name},
                        success: function (data) {
                            let courses = data.response.courses;

                            courses = courses.map(function (value, index, array) {
                                if (typeof(value) !== "string") return value[0];
                                else return value;
                            });
                            course_lists[name] =courses;
                            if (data.response.type !== name) return;
                            let card = createCourseListSection(type, title, courses, original_section_count);
                            placeholder.replaceWith(card);
                        }
                    }));
                } else {
                    let card = createCourseListSection(type, title, section['courses']);
                    reqs_list.append(card);
                    section_count++;
                }
            }
        }
        if (type === "x_from_category") {
            for (let section of data.required[type]) {
                let title = 'Choose at least ' + section['num'] + ' units' +
                    '<span class="unit-count mr-2">0/' + section['num'] + '</span>\n';
                let card = createCourseCategorySection(type, title, section['code'], section.level);
                reqs_list.append(card);
                section_count++;
            }
        }
        if (type === "required_m/m/s") {
            for (let code of data.required[type]) {
                let mms_type = code.split('-').pop();
                let card = $('<div class="deg deg-plain-text">\n' +
                    '    <span class="mms-code"></span>\n' +
                    '    <strong>Compulsory ' + mms_abbrev[mms_type] + ':</strong>\n' +
                    '    <div id="deg-section' + section_count + '"></div>' +
                    '</div>');
                let title_node = $('<span/>');
                mms_to_retrieve[code] = title_node;
                mms_to_display.push(code);
                card.append(title_node);
                card.append('<span class="unit-count mr-1">0/' + mms_units[mms_type] + '</span>');
                reqs_list.append(card);
                section_count++;
            }
        }
        if (type === "one_from_m/m/s") {
            for (let section of data.required[type]) {
                let card = createMMSListSection(type, "Complete one of these majors, minors, or specialisations", section)
                reqs_list.append(card);
                section_count++;
            }
        }
        if (type === "max_by_level") {
            for (let level in data.required[type]) {
                let limit = data.required[type][level];
                let card = $('<div class="deg deg-plain-text">\n' +
                    '    <div id="deg-section' + section_count + '"></div>\n' +
                    '    At most ' + limit + ' units of ' + level + '-level courses\n' +
                    '</div>');
                card.append('<span class="unit-count mr-1">0/' + limit + '</span>');
                reqs_list.append(card);
                section_count++;
            }
        }
    }
    $.when.apply($, ajax_requests).then(function () {
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
                        for (let node of titles_to_retrieve[course['course_code']]) {
                            node.text(course['title']);
                            node.parent().each(coursePopoverSetup)
                        }
                    }
                }
            });
        }
        for (let code in mms_to_retrieve) {
            $.ajax({
                url: 'degree/mms',
                data: {'query': code},
                success: function (data) {
                    mms_info[data.code] = data;
                    let node = mms_to_retrieve[code];
                    node.text(data.name);
                    if (node.parent().hasClass('result-mms')) node.parent().each(mmsPopoverSetup);
                    if (mms_to_display.includes(code)) mms_add(code);
                    $('#mms-active-list').find('.mms-code').each(function () {
                        if ($(this).text() === code) {
                            $(this).parent().find('.mms-delete').remove();
                        }
                    });
                }
            })
        }
        updateProgress();
    })
}

function updateProgress() {
    updateMMS();

    let degree_completed = true;
    const dq = $('#degree-reqs-list');

    function setCardColour(card, success) {
        if (success) card.addClass('alert-success').removeClass('alert-warning').removeClass('alert-danger');
        else card.addClass('alert-warning').removeClass('alert-success').removeClass('alert-danger');
    }

    function setCourseTicks(card, matches, courses, forcecrosses) {
        for (let c of card.find('.result-course')) {
            if (matches.has($(c).find('.course-code').text())) {
                $(c).removeClass('exc').addClass('inc');
            } else if (forcecrosses) $(c).removeClass('inc').addClass('exc');
            else $(c).removeClass('inc').removeClass('exc')
        }
    }

    let section_count = 0;
    let req = degree_requirements.required;
    for (let type in degree_requirements.required) {
        if (type === "compulsory_courses") {
            const card = dq.find('#deg-section' + section_count).parent();
            const matches = matchInDegree(new Set(req[type]));
            setCourseTicks(card, matches, req[type], true);
            let section_completed = (matches.size === req[type].length);
            degree_completed = degree_completed && section_completed;
            setCardColour(card, section_completed);
            section_count++;
        }
        if (type === "one_from_here") {
            for (let section of req[type]) {
                const card = dq.find('#deg-section' + section_count).parent();
                const matches = matchInDegree(new Set(section));
                setCourseTicks(card, matches, section, false);
                let section_completed = (matches.size >= 1);
                degree_completed = degree_completed && section_completed;
                setCardColour(card, section_completed);
                section_count++;
            }
        }
        if (type === "x_from_here") {
            for (let section of req[type]) {
                const card = dq.find('#deg-section' + section_count).parent();
                let courses = section['courses'];
                if (typeof(section['courses']) === "string") courses = course_lists[section['courses']];
                const matches = matchInDegree(new Set(courses));
                setCourseTicks(card, matches, courses, false);
                let section_units = matches.size * 6;
                let section_completed = (section_units >= section['num']);
                degree_completed = degree_completed && section_completed;
                setCardColour(card, section_completed);
                let unit_count = card.find('.unit-count');
                let unit_target = parseInt(unit_count.text().split('/')[1]);
                unit_count.text(section_units + '/' + unit_target);
                section_count++;
            }
        }
        if (type === "x_from_category") {
            for (let section of req[type]) {
                const card = dq.find('#deg-section' + section_count).parent();
                const matches = matchCategoryInDegree(section['code'], section['level']);
                const group = card.find('.list-group');
                group.empty();
                for (let course of matches) {
                    const item = $(
                        '<div class="list-group-item list-group-item-action result-course inc">' +
                        '    <span class="course-code">' + course + '</span> ' +
                        '    <span class="course-title">' + course_titles[course] + '</span>' +
                        '</div>'
                    );
                    item.each(coursePopoverSetup);
                    group.append(item);
                }
                let section_units = matches.size * 6;
                let section_completed = (section_units >= section['num']);
                degree_completed = degree_completed && section_completed;
                setCardColour(card, section_completed);
                let unit_count = card.find('.unit-count');
                let unit_target = parseInt(unit_count.text().split('/')[1]);
                unit_count.text(section_units + '/' + unit_target);
                section_count++;
            }
        }
        if (type === "required_m/m/s") {
            for (let code of req[type]) {
                const card = dq.find('#deg-section' + section_count).parent();
                let mms_panel = active_mms[code];
                if (mms_panel === undefined) continue;
                let section_completed = (mms_panel && mms_panel.hasClass('alert-success'));
                degree_completed = degree_completed && section_completed;
                setCardColour(card, section_completed);
                let unit_count = card.find('.unit-count');
                unit_count.text($(mms_panel[0].firstElementChild).find('.unit-count').text());
                section_count++;
            }
        }
        if (type === "one_from_m/m/s") {
            for (let section of req[type]) {
                const card = dq.find('#deg-section' + section_count).parent();
                let section_completed = false;
                let section_started = false;
                for (let code of section) {
                    let mms_panel = active_mms[code];
                    section_started = section_started || mms_panel !== undefined;
                    let mms_completed = mms_panel && mms_panel.hasClass('alert-success');
                    section_completed = section_completed || mms_completed;
                    for (let mms of card.find('.mms-code')) {
                        if ($(mms).text() === code) {
                            if (mms_completed) {
                                $(mms).parent().addClass('inc').removeClass('partial');
                            } else if (mms_panel !== undefined) {
                                $(mms).parent().addClass('partial').removeClass('inc');
                            } else {
                                $(mms).parent().removeClass('partial').removeClass('inc');
                            }
                        }
                    }
                }
                degree_completed = degree_completed && section_completed;
                setCardColour(card, section_completed);
                if (!section_started) {
                    card.removeClass('alert-success');
                    card.removeClass('alert-warning');
                    card.addClass('alert-danger');
                }
            }
            section_count++;
        }
        if (type === "max_by_level") {
            for (let level in req[type]) {
                const card = dq.find('#deg-section' + section_count).parent();
                let count = 0;
                for (let session in degree_plan) {
                    let courses = degree_plan[session];
                    for (let c of courses) {
                        if (c.code.charAt(4) === level.charAt(0)) count += 6;
                    }
                }
                let section_completed = count <= req[type][level];
                degree_completed = degree_completed && section_completed;
                if (section_completed) card.addClass('alert-success').removeClass('alert-danger');
                else card.addClass('alert-danger').removeClass('alert-success');
                let unit_count = card.find('.unit-count');
                let unit_target = parseInt(unit_count.text().split('/')[1]);
                unit_count.text(count + '/' + unit_target);

                section_count++;
            }
        }
    }
    let overall_units = 0;
    for (let session in degree_plan) {
        let courses = degree_plan[session];
        for (let c of courses) {
            if (c.code !== ELECTIVE_TEXT) overall_units += 6;
        }
    }
    let unit_count = $('#degree-header').find('.unit-count');
    unit_count.text(overall_units + '/' + degree_requirements.units + ' units');
    if (overall_units < degree_requirements.units) unit_count.css({'color': 'crimson'});
    else unit_count.css({'color': ''});
    degree_completed = degree_completed && overall_units >= degree_requirements.units;
    if (degree_completed) $('#degree-completed-notice').css({'display': 'block'});
    else $('#degree-completed-notice').css({'display': ''});
}

$('#left-panel').find('a[data-toggle="tab"]').on('hide.bs.tab', function () {
    $('#left-panel').find('.result-course').popover('hide');
    $('#show-filters').popover('hide');
});

function updateRecommendations() {
    $.ajax({
        url: 'search/recommend',
        data: {
            'code': degree_code,
            'courses': JSON.stringify(preparePlanForUpload(degree_plan))
        },
        success: function (data) {
            let titles_to_retrieve = {};
            let group = $('#degree-recommendations-list');
            group.empty();
            for (const course of data.response) {
                const code = course.course;
                const reason = course.reasoning;

                let item = $(
                    '<div class="draggable-course result-course list-group-item list-group-item-action">\n' +
                    '    <span class="course-code">' + code + '</span>\n' +
                    '</div>\n');
                let title_node = $('<span class="course-title"></span>');
                if (code in course_titles) title_node.text(course_titles[code]);
                else {
                    if (!(code in titles_to_retrieve)) titles_to_retrieve[code] = [];
                    titles_to_retrieve[code].push(title_node);
                }
                item.append(title_node);
                item.append('<div class="course-reason">' + reason + '</div>');
                makeCourseDraggable(item, code);
                item.each(coursePopoverSetup);
                group.append(item);
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
                                let popover = node.parents('.result-course').data('bs.popover');
                                const new_content = $($(popover.config.content)[0]).text(course['title']);
                                popover.config.content = new_content.prop('outerHTML');
                            }
                        }
                    }
                });
            }
        }
    })
}
