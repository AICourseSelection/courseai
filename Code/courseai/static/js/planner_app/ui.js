// Reference Constants
const SESSION_WORDS = {
    'Su': 'Summer Session',
    'S1': 'Semester 1',
    'Au': 'Autumn Session',
    'Wi': 'Winter Session',
    'S2': 'Semester 2',
    'Sp': 'Spring Session'
};

let SESSION_ABBREVS = {};
for (const abb in SESSION_WORDS) SESSION_ABBREVS[SESSION_WORDS[abb]] = abb;

const THIS_YEAR = (new Date()).getFullYear().toString();

// UI Functions
async function addDegree(code, year) {
    let add = await PLAN.addDegree(code, year);
    if (!add) console.log("Tried to add degree " + code + " (" + year + "), already present.");
    const titleText = PLAN.degrees.reduce((d1, d2) => d1.title + ' and ' + d2.title);
    $('#degree-title-text').text(titleText);
}

function clearAllCourses() {
    PLAN.clearAllCourses();

    for (let box of $('#plan-grid').find('.plan-cell')) {
        $(box).popover('dispose');
        makeSlotDroppable($(box));
        $(box).find('.course-code').text(ELECTIVE_TEXT);
        $(box).find('.course-title').text('');
    }

    //TODO: Call 'UpdateProgress'
}

function addCourse(code, title, session, position, update_recommendations = true) {
    PLAN.addCourse(session, code);
    const year = session.split('S')[0];
    const sem = 'Semester ' + session.split('S')[1];
    const row = $('#plan-grid').find('.plan-row').filter(function () {
        const first_cell = $(this.children[0]);
        return (first_cell.find('.row-year').text() === year && first_cell.find('.row-sem').text() === sem);
    });
    const box = $(row.children()[position + 1]);
    box.droppable('destroy');
    box.find('.course-code').text(code);
    box.find('.course-title').text(title);
    box.each(coursePopoverSetup);
    // TODO: Call UpdateProgress
    if (update_recommendations) updateRecommendations();
}

// Startup Section
let PLAN = new Plan();
let SEARCH = new Search();
addDegree(degree_code, start_year);
let total_units = PLAN.degrees.reduce((x, y) => (x.totalUnits - 48) + (y.totalUnits - 48));
for (let i = 0; i <= total_units / 24; i++) {
    PLAN.addSession(nextSession(start_year + 'S' + start_sem, i));
}
fillCourseTable();

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

$('.result-course').each(coursePopoverSetup); // TODO: Check if this can be removed

// Event Handlers
function clickCell() {
    if ($(this).find('.course-code').text() === ELECTIVE_TEXT) {
        let first_cell = $(this).parent().find('.first-cell');
        const year = first_cell.find('.row-year').text();
        const sem = first_cell.find('.row-sem').text();
        const add_filter = SEARCH.addFilter('session', year + 'S' + sem.slice(-1));
        if (add_filter) {
            let filter_icon = $('<span class="badge badge-primary">' + add_filter +
                '</span>');
            let delete_button = $('<a class="filter-delete">×</a>');
            delete_button.click(deleteFilter);
            filter_icon.append(delete_button);
            $('#filter-icons').append(filter_icon, ' ');
            SEARCH.courseSearch($('#add-course').val(), function () {
                searchResultsLoading(show, true)
            }, updateCourseSearchResults);
        }
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

async function coursePopoverData(cell, descriptionOnly = false) {
    const code = $(cell).find('.course-code').text();
    const year = $(cell).find('.course-year').text() || THIS_YEAR; // Current year, for popovers on courses that are not in the plan table.
    // TODO: Fix for course years. Likely require server-side input (to search results) on the most recent year available.
    const me = cell;
    $(cell).parents('.popover-region').find('.result-course, .result-mms').each(function () {
        if (this != me) $(this).popover('hide');
    });
    let popover = $(cell).data('bs.popover');
    if (popover['data-received'] || false) return;
    let curr_popover = $(popover.tip);
    let offering = getCourseOffering(code, year);
    let html = '<div class="h6 result-title mb-1">' + offering.title + '</div>\n';
    if (![undefined, 'nan'].includes(offering.extras['description'])) {
        const truncated_description = offering.extras['description'].slice(0, 350) + '...';
        html += '<h6 class="mt-2">Description</h6>\n' +
            '<div class="result-description">' + truncated_description + '</div>\n';
    }
    if (!descriptionOnly) {
        const semesters = offering.extras['semester'];
        if (![undefined, 'nan'].includes(semesters)) {
            if (semesters.length === 0) html += '<h6 class="mt-2">Not available in standard semesters</h6>';
            else if (semesters.length === 2) html += '<h6 class="mt-2">Available in both semesters</h6>';
            else html += '<h6 class="mt-2">Available in Semester ' + semesters[0] + '</h6>';
        }

        if (![undefined, 'nan'].includes(offering.extras['prerequisite_text'])) {
            html += '<h6 class="mt-2">Prerequisites and Incompatibility</h6>\n' +
                '<div class="result-description">' + offering.extras['prerequisite_text'] + '</div>\n';
        }
    }
    html += '<h6 class="mt-2">Related Courses</h6>\n' +
        '<div class="related-courses list-group"></div>';
    popover.config.content = $(popover.config.content).first().prop('outerHTML');
    popover.config.content += html;
    curr_popover.find('.fa-refresh').css({'display': 'none'});
    curr_popover.find('.popover-body').append(html);
    popover['data-received'] = true;

    const first_cell = $(course.parentElement.firstElementChild);
    let session = year;
    if (first_cell.hasClass('first-cell')) session += SESSION_ABBREVS[first_cell.find('.row-sem').text()];
    else session += "S1"; // Placeholder session for courses which are not in the degree plan.
    let res = {};
    $.ajax({
        url: 'recommendations/recommend',
        data: {
            'code': degree_code,
            'courses': JSON.stringify({[session]: [{"code": code}]})
        },
        success: function (data) {
            res = data;
        },
        async: false
    });
    let titles_fill_nodes = {};
    let group = curr_popover.find('.related-courses');
    for (const course of res.response) {
        const code = course.course;
        const year = THIS_YEAR; // TODO: Fix for course years. Need the most recent year with data available.
        const reason = course.reasoning;

        let item = $(
            '<div class="draggable-course result-course list-group-item list-group-item-action">\n' +
            '    <span class="course-code">' + code + '</span>\n' +
            '</div>\n');
        let title_node = $('<span class="course-title"></span>');
        if (code in KNOWN_COURSES && year in KNOWN_COURSES[code]) {
            title_node.text(KNOWN_COURSES[code][year].title)
        }
        else {
            if (!(code in titles_fill_nodes)) titles_fill_nodes[code] = [];
            titles_fill_nodes[code].push(function (title) {
                title_node.text(title);
            });
        }
        item.append(title_node);
        item.append('<div class="course-reason">' + reason + '</div>');
        makeCourseDraggable(item, code);
        item.each(coursePopoverSetup);
        group.append(item);
    }
    await batchCourseTitles(titles_fill_nodes);
    let popover_content = $('<div>' + popover.config.content + '</div>');
    popover_content.find('.related-courses').replaceWith(group.clone());
    popover.config.content = popover_content.html();
}

async function mmsPopoverData() {
    const code = $(this).find('.mms-code').text();
    const year = THIS_YEAR; // TODO: Fix for MMS years. Need the most recent year with data available.
    $(this).parents('.popover-region').find('.result-course, .result-mms').each(function () {
        if ($(this).find('.mms-code').text() !== code) {
            $(this).popover('hide');
        }
    });
    let popover = $(this).data('bs.popover');
    let curr_popover = $(popover.tip);
    let add_button = curr_popover.find('button');
    if (code in PLAN.trackingMMS(code, year)) {
        add_button.attr("disabled", true);
        add_button.text('Already in Plan');
    } else {
        add_button.attr("disabled", false);
        add_button.text('Add to Plan');
    }

    if (popover['data-received'] || false) return;
    let offering = getMMSOffering(code, year);
    const composition = $('<div class="result-composition"/>');
    for (let section of offering.rules) {
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
}

// Event Functions
function fillCourseTable() {
    let titles_fill_nodes = {};
    for (const plan_section of PLAN.degrees[0].suggestedPlan) { //TODO: Fix for FDDs
        for (const session in plan_section) {
            if (!plan_section.hasOwnProperty(session)) continue;
            const year = session.slice(0, 4);
            const ses = session.slice(4);
            let first_cell = '<div class="first-cell">' +
                '<div class="row-year h4">' + year + '</div>' +
                '<div class="row-sem h5">' + SESSION_WORDS[ses] + '</div>' +
                '</div>';
            let row = $('<div class="plan-row"/>');
            if (ses === 'Semester 1') row.addClass('mt-3'); //TODO: Fix for Summer Sessions
            row.append(first_cell);

            let course_list = plan_section[session];
            for (const course of course_list) {
                PLAN.addCourse(session, course.code);
                let cell = $('<div class="plan-cell result-course" tabindex="' + tab_index_count + '"/>');
                tab_index_count++;
                let title_node = $('<span class="course-title"/>');
                if (false && course['title'] !== undefined) {   // Ignore the degree's own titles for now
                    title_node.text(course['title']);
                } else if (course.code !== ELECTIVE_TEXT) {
                    if (!(course.code in titles_fill_nodes)) titles_fill_nodes[course.code] = [];
                    titles_fill_nodes[course.code].push(function (title) {
                        title_node.text(title);
                    });
                }
                cell.append('<div class="course-code">' + course['code'] + '</div>');
                cell.append('<div class="course-year">' + year + '</div>');
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
    batchCourseTitles(titles_fill_nodes);
}

function coursePopoverSetup(i, item) {
    const code = $(this).find('.course-code').text();
    if (code === ELECTIVE_TEXT) return;
    $(this).popover({
        trigger: 'click',
        title: code + '<a class="popover-close" onclick="closePopover(this)">×</a>',
        placement: 'right',
        html: true,
        content: '<div class="d-flex">\n' +
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

function updateCourseSearchResults(response) {
    let results = $('#results-courses');
    let cbody = $(results.find('.card-body'));

    cbody.find('.result-course').popover('dispose');
    cbody.empty();

    if (response.length > 0) {
        for (let r of response.slice(0, 10)) {
            const code = r['code'];
            const title = r['title'];
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
    searchResultsLoading(false, true);
    results.collapse('show');
    console.log('Course search successful');
}

async function updateRecommendations() {
    let group = $('#degree-recommendations-list');
    let res = {};
    $.ajax({
        url: 'recommendations/recommend',
        data: {
            'code': degree_code,
            'courses': JSON.stringify(preparePlanForUpload(degree_plan))
        },
        success: function (data) {
            res = data;
        }
    });
    let titles_to_retrieve = {};
    group.find('.result-course').popover('dispose');
    group.empty();
    for (const course of res.response) {
        const code = course.course;
        const reason = course.reasoning;

        let item = $(
            '<div class="draggable-course result-course list-group-item list-group-item-action">\n' +
            '    <span class="course-code">' + code + '</span>\n' +
            '</div>\n');
        let title_node = $('<span class="course-title"></span>');
        if (code in KNOWN_COURSES && year in KNOWN_COURSES[code]) {
            title_node.text(KNOWN_COURSES[code][year].title)
        }
        else {
            if (!(code in titles_fill_nodes)) titles_fill_nodes[code] = [];
            titles_fill_nodes[code].push(function (title) {
                title_node.text(title);
            });
        }
        item.append(title_node);
        item.append('<div class="course-reason">' + reason + '</div>');
        makeCourseDraggable(item, code);
        item.each(coursePopoverSetup);
        group.append(item);
    }
    await batchCourseTitles(titles_fill_nodes);
}

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

/**
 * Show or hide loading indicators in the search results panels.
 * @param show  true to show indicators, false to hide indicators.
 * @param courses   true to change the course results, false to change the MMS ones.
 */
function searchResultsLoading(show, courses) {
    const resultsLists = $('#search-results-list').children();
    const courseResultsList = resultsLists.first();
    const mmsResultsList = resultsLists.not(':first');
    const cDisplay = {true: 'none', false: ''};
    const rDisplay = {true: 'inline-block', false: 'none'};
    if (courses) {
        courseResultsList.find('.collapse').css({'display': cDisplay[show]});
        courseResultsList.find('.fa-refresh').css({'display': rDisplay[show]});
    } else {
        mmsResultsList.find('.collapse').css({'display': cDisplay[show]});
        mmsResultsList.find('.fa-refresh').css({'display': rDisplay[show]});
    }
}