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
const ELECTIVE_TEXT = "Elective Course";

// UI Functions
async function addDegree(code, year) {
    let add = await PLAN.addDegree(code, year);
    if (!add) console.log("Tried to add degree " + code + " (" + year + "), already present.");
    let titleText = "";
    if (PLAN.degrees.length === 1) titleText = PLAN.degrees[0].title;
    else titleText = PLAN.degrees.reduce((d1, d2) => d1.title + ' and ' + d2.title);
    $('#degree-title-text').text(titleText);
    return add;
}

function clearAllCourses() {
    PLAN.clearAllCourses();
    for (let box of $('#plan-grid').find('.plan-cell')) {
        $(box).popover('dispose');
        makeSlotDroppable($(box));
        $(box).find('.course-code').text(ELECTIVE_TEXT);
        $(box).find('.course-title').text('');
    }
    //TODO: Update progress and warnings.
}

function resetPlan() {
    clearAllCourses();
    $('#plan-grid').empty();
    loadDefaultPlan();
}

function addCourse(code, title, session, position) {
    const year = session.slice(0, 4);
    const sem = SESSION_WORDS[session.slice(4)]; // TODO: Fix for Summer Sessions
    const row = $('#plan-grid').find('.plan-row').filter(function () {
        const first_cell = $(this.children[0]);
        return (first_cell.find('.row-year').text() === year && first_cell.find('.row-sem').text() === sem);
    });
    const box = $(row.children()[position + 1]);
    box.droppable('destroy');
    box.find('.course-code').text(code);
    box.find('.course-title').text(title);
    box.each(coursePopoverSetup);
    $.when(PLAN.addCourse(session, code).then(function () {
        updateProgress();
        updateRecommendations();
    }));
}

function removeCourse(session, position) {
    const year = session.slice(0, 4);
    const sem = SESSION_WORDS[session.slice(4)]; // TODO: Fix for Summer Sessions
    const row = $('#plan-grid').find('.plan-row').filter(function () {
        const first_cell = $(this.children[0]);
        return (first_cell.find('.row-year').text() === year && first_cell.find('.row-sem').text() === sem);
    });
    const box = $(row.children()[position]);
    const code = box.find('.course-code').text();
    if (box.prevAll().hasClass('ui-sortable-placeholder')) position--;
    box.popover('dispose');
    box.find('.course-code').text(ELECTIVE_TEXT);
    box.find('.course-title').text('');
    makeSlotDroppable(box);
    PLAN.removeWarning('CourseForceAdded', code);
    PLAN.removeCourse(session, code);

    updateWarningNotices();
    updateProgress();
    updateRecommendations();
}

function addFilter(type, data) {
    if (SEARCH.getFilter(type, data)) return;
    const filter = SEARCH.addFilter(type, data);
    let filter_icon = $('<span class="badge badge-primary">' + filter + '</span>');
    let delete_button = $('<a class="filter-delete">×</a>');
    delete_button.click(function () {
        SEARCH.deleteFilter(type, data);
        filter_icon.remove();
        search(true);
    });
    filter_icon.append(delete_button);
    $('#filter-icons').append(filter_icon, ' ');
    search(true);
}

async function mms_add(code, year) {
    const mms = await getMMSOffering(code, year);
    PLAN.addMMS(code, year);
    let mms_active_list = $('#mms-active-list');
    let mms_card = $('<div class="mms card"/>');
    const identifier = code + '-' + year;
    let card_header = $(
        '<div class="card-header btn text-left pl-2" data-toggle="collapse" data-target="#mms-active-' + identifier + '">\n' +
        '    <span class="mms-code">' + code + '</span>\n' +
        '    <span class="mms-year">' + year + '</span>\n' +
        '    <strong>' + MMS_TYPE_PRINT[mms.type] + '</strong>: ' + mms.title + '\n' +
        '    <button class="mms-delete btn btn-danger" onclick="deleteMMS(this)">×</button>\n' +
        '    <span class="unit-count mr-2">0/' + mms.units + '</span>\n' +
        '</div>');
    let collapsible = $(
        '<div id="mms-active-' + identifier + '" class="collapse show">' +
        '</div>'
    );
    collapsible.on('hide.bs.collapse', function () {
        $(this).find('.result-course').popover('hide');
    });
    collapsible.sortable({
        items: "> .mms-select-min, .mms-select-max"
    });
    let titles_fill_nodes = {};

    for (let i in mms.rules) {
        let value = mms.rules[i];
        if (value.type === "fixed") {
            let required = $('<div class="mms-required list-group list-group-flush"/>');
            let course_list = $('<div id="mms-active-' + identifier + '-select' + i + '" class="collapse show"/>');
            for (let course of value.course) {
                let title_node = $('<span class="course-title"/>');
                if (course.code in KNOWN_COURSES && year in KNOWN_COURSES[course.code]) {
                    title_node.text(KNOWN_COURSES[course.code][year].title)
                }
                else {
                    if (!(course.code in titles_fill_nodes)) titles_fill_nodes[course.code] = [];
                    titles_fill_nodes[course.code].push(function (title) {
                        title_node.text(title);
                    });
                }
                let item = $(
                    '<div class="list-group-item list-group-item-action draggable-course result-course">' +
                    '    <span class="course-code">' + course.code + '</span> ' +
                    '</div>'
                );
                item.append(title_node);
                makeCourseDraggable(item, course.code);
                item.each(coursePopoverSetup);
                course_list.append(item);
                required.append(course_list);
            }
            collapsible.append(required);
        } else if (['minimum', 'maximum'].includes(value.type)) {
            let label_text = 'at least ';
            if (value.type === 'maximum') label_text = 'up to ';
            let select = $(
                '<div class="mms-select-' + value.type.slice(0, 3) + ' card">\n' +
                '    <div class="card-header btn text-left pl-2" data-toggle="collapse"\n' +
                '         data-target="#mms-active-' + identifier + '-select' + i + '">\n' +
                '        Choose ' + label_text + value.units + ' units\n' +
                '        <span class="unit-count mr-2">0/' + value.units + '</span>\n' +
                '    </div>\n' +
                '</div>');
            if (value.type === 'maximum') select.addClass('alert-success');
            let options = $('<div class="mms-optional list-group list-group-flush"/>');
            for (let course of value.course) {
                let title_node = $('<span class="course-title"/>');
                if (course.code in KNOWN_COURSES && year in KNOWN_COURSES[course.code]) {
                    title_node.text(KNOWN_COURSES[course.code][year].title)
                }
                else {
                    if (!(course.code in titles_fill_nodes)) titles_fill_nodes[course.code] = [];
                    titles_fill_nodes[course.code].push(function (title) {
                        title_node.text(title);
                    });
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

            let collapse = $('<div id="mms-active-' + identifier + '-select' + i + '" class="collapse show"/>');
            collapse.on('hide.bs.collapse', function () {
                $(this).find('.result-course').popover('hide');
            });
            collapse.append(options);
            select.append(collapse);
            collapsible.append(select);
        }

    }
    mms_card.append(card_header);
    mms_card.append(collapsible);
    if (mms_active_list.children().length === 0) $('#mms-list-placeholder').addClass('d-none');
    mms_active_list.prepend(mms_card);
    const collapse_button = $('.collapse-all');
    if (collapse_button.text() === 'Collapse all') collapse_button.click();
    else $('#degree-reqs-list').find('.collapse').collapse('hide');
    $(this).attr("disabled", true);
    $(this).text('Already in Plan');
    await batchCourseTitles(titles_fill_nodes);
    updateProgress();
}

async function deleteMMS(button) {
    const code = $(button).parent().find('.mms-code').text();
    const year = $(button).parent().find('.mms-year').text();
    const mms = await getMMSOffering(code, year);
    PLAN.trackedMMS.splice(PLAN.trackedMMS.indexOf(mms), 1); // Delete from the plan.
    $(button).parents('.mms').find('.result-course').popover('dispose');
    $(button).parents('.mms').remove();
    if ($('#mms-active-list').children().length === 0) $('#mms-list-placeholder').removeClass('d-none');
    updateProgress();
}

function closePopover(button) {
    $(button).parents('.popover').popover('hide');
}

// Startup Section
let PLAN = new Plan();
let SEARCH = new Search(PLAN);
let starting_degree = addDegree(degree_code, start_year);
$.when(starting_degree.then(function (degree) {
    setupDegreeRequirements(degree);
    let total_units = PLAN.degrees.reduce((x, y) => (x.units - 48) + (y.units - 48));
    for (let i = 0; i <= total_units / 24; i++) {
        PLAN.addSession(nextSession(start_year + 'S' + start_sem, i));
    }
    loadDefaultPlan();
}));

let rc_button = $('#rc-button');

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
            "courses": preparePlanForUpload(PLAN)
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

$('#confirm-reset-button').click(resetPlan);

$('.result-course').each(coursePopoverSetup); // TODO: Check if this can be removed.

$('#add-course').on('keyup', function () {
    search();
});

$('.collapse').on('hide.bs.collapse', function () {
    $(this).find('.result-course').popover('hide');
});

$('.collapse-all').click(function () {
    if (this.textContent === "Collapse all") {
        $('#degree-reqs-list').find('.collapse').collapse('hide');
        $(this).text("Expand all")
    } else if (this.textContent === 'Expand all') {
        $('#degree-reqs-list').find('.collapse').collapse('show');
        $(this).text("Collapse all")
    }
});

$('#results-majors, #results-minors, #results-specs').on('hide.bs.collapse', function () {
    $(this).find('.result-mms').popover('hide');
});

$('#show-filters').popover({
    trigger: 'click',
    title: 'Search Filters <a class="popover-close" onclick="closePopover(this)">×</a>',
    placement: 'right',
    html: true,
    content: '<form onsubmit="return filterSubmit(this)">\n' +
    '<div class="form-row" style="padding: 0 5px">' +
    '<label for="code-input">Filter course codes: </label></div>\n' +
    '<div class="form-row" style="padding: 0 5px">\n' +
    '    <div style="width: 100%; float:left; padding-right: 61px;"><input id="code-input" type="text" maxlength="4" class="form-control"></div>\n' +
    '    <button type="submit" class="btn btn-primary" style="float: left; margin-left: -56px;">Add</button>\n' +
    '</div>\n' +
    '<div class="form-row" style="padding: 0 5px"><label>Filter course level: </label></div>\n' +
    '<div class="form-row">\n' +
    '    <div class="col-3"><button class="btn btn-outline-primary btn-sm" onclick="addFilter(\'level\', \'1000\')">1000</button></div>\n' +
    '    <div class="col-3"><button class="btn btn-outline-primary btn-sm" onclick="addFilter(\'level\', \'2000\')">2000</button></div>\n' +
    '    <div class="col-3"><button class="btn btn-outline-primary btn-sm" onclick="addFilter(\'level\', \'3000\')">3000</button></div>\n' +
    '    <div class="col-3"><button class="btn btn-outline-primary btn-sm" onclick="addFilter(\'level\', \'4000\')">4000</button></div>\n' +
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

$('#mms-active-list').sortable();

$('#left-panel').find('a[data-toggle="tab"]').on('hide.bs.tab', function () {
    $('#left-panel').find('.result-course').popover('hide');
    $('#show-filters').popover('hide');
});


// Event Handlers
function clickCell() {
    if ($(this).find('.course-code').text() === ELECTIVE_TEXT) {
        let first_cell = $(this).parent().find('.first-cell');
        const year = first_cell.find('.row-year').text();
        const sem = first_cell.find('.row-sem').text();
        addFilter('session', year + SESSION_ABBREVS[sem]);
    }
}

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

async function coursePopoverData(cell, descriptionOnly = false) {
    const code = $(cell).find('.course-code').text();
    const year = $(cell).find('.course-year').text() || THIS_YEAR; // Current year, for popovers on courses that are not in the plan table.
    // TODO: Fix for course years. Likely require server-side input (to search results) on the most recent year available.
    const me = cell;
    $(cell).parents('.popover-region').find('.result-course, .result-mms').each(function () {
        if (this !== me) $(this).popover('hide');
    });
    let popover = $(cell).data('bs.popover');
    if (popover['data-received'] || false) {
        return;
    }
    let curr_popover = $(popover.tip);
    let offering = await getCourseOffering(code, year);
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
    html += '<h6 class="mt-2">Related Courses</h6>\n';
    curr_popover.find('.popover-body').append(html);
    curr_popover.find('.popover-body').append('<div class="related-courses list-group"/>');

    const first_cell = $(cell.parentElement.firstElementChild);
    let session = year;
    if (first_cell.hasClass('first-cell')) session += SESSION_ABBREVS[first_cell.find('.row-sem').text()];
    else session += "S1"; // Placeholder session for courses which are not in the degree plan.
    let res = {};
    await $.ajax({
        url: 'recommendations/recommend',
        data: {
            'code': degree_code,
            'courses': JSON.stringify([{[session]: [{"code": code}]}])
        },
        success: function (data) {
            res = data;
        },
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
            '    <span class="course-year">' + year + '</span>\n' +
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
        makeCourseDraggable(item, code, year);
        item.each(coursePopoverSetup);
        group.append(item);
    }
    html += group[0].outerHTML;
    curr_popover.find('.fa-sync-alt').parent().removeClass('d-flex').addClass('d-none');
    popover.config.content = html;
    popover['data-received'] = true;
    await batchCourseTitles(titles_fill_nodes);
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
    if (PLAN.trackingMMS(code, year)) {
        add_button.attr("disabled", true);
        add_button.text('Already in Plan');
    } else {
        add_button.attr("disabled", false);
        add_button.text('Add to Plan');
    }

    if (popover['data-received'] || false) return;
    let offering = await getMMSOffering(code, year);
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
    curr_popover.find('.fa-sync-alt').css({'display': 'none'});
    curr_popover.find('.popover-body').append(html);
    popover['data-received'] = true;
    $('.mms-add button').click(mms_click_add);
}

function search(coursesOnly = false) {
    const query = $('#add-course').val();
    SEARCH.courseSearch(query, function () {
        searchResultsLoading(true, true)
    }, updateCourseSearchResults);
    if (coursesOnly) return;
    SEARCH.mmsSearch(query, function () {
        searchResultsLoading(true, false)
    }, updateMMSSearchResults);
}

function dropOnSlot(event, ui) {
    $(this).removeClass('active-drop');
    const row = event.target.parentElement;
    const first_cell = $(row.firstElementChild);
    const code = ui.draggable.find('.course-code').text();
    const title = ui.draggable.find('.course-title').text();
    const session = first_cell.find('.row-year').text() + SESSION_ABBREVS[first_cell.find('.row-sem').text()];
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
        } else if (reason === "Not available in this semester/session") {
            $('#unavail-modal-course').text(ui.draggable.find('.course-code').text());
            modal = $('#unavail-modal');
        }
        let override_button = modal.find('#course-add-override');
        override_button.off('click');
        override_button.click(function () {
            addCourse(code, title, session, position);
            let warning = new Warning("CourseForceAdded", code, [function () {
                $(event.target).animate({boxShadow: '0 0 25px #007bff'});
                $(event.target).animate({boxShadow: ''});
            }]);
            PLAN.warnings.push(warning);
            updateWarningNotices();
        });
        modal.modal();
        return
    }
    addCourse(code, title, session, position);
}

function filterSubmit(form) {
    const code = $(form).find('input[type=text]').val().toUpperCase();
    if (code) addFilter('code', code);
    return false;
}

async function mms_click_add() {
    const code = $(this).parents('.popover').attr('data-code');
    const year = THIS_YEAR; // TODO: Fix for MMS years. Need the most recent year with data available.
    const mms = await getMMSOffering(code, year);
    if (PLAN.trackedMMS.includes(mms)) return;

    $('#search-results-list, #degree-reqs-list').find('.result-mms').each(function () {
        if ($(this).find('.mms-code').text() === code) {
            $(this).popover('hide');
        }
    });
    mms_add(code, year)
}

// Event Functions
function loadDefaultPlan() {
    let titles_fill_nodes = {};
    let grid = $('#plan-grid');
    let async_operations = [];
    for (const plan_section of PLAN.degrees[0].suggestedPlan) { //TODO: Fix for FDDs
        for (const session in plan_section) {
            if (!(PLAN.sessions.includes(session))) PLAN.addSession(session);
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
                let cell = $('<div class="plan-cell result-course" tabindex="5"/>'); // Tabindex so we can have :active selector
                let title_node = $('<span class="course-title"/>');
                if (false && course['title'] !== undefined) {   // Ignore the degree's own titles for now
                    title_node.text(course['title']);
                } else if (course.code !== ELECTIVE_TEXT) {
                    async_operations.push(PLAN.addCourse(session, course.code));
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
                            const session = first_cell.find('.row-year').text() + SESSION_ABBREVS[first_cell.find('.row-sem').text()];
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

                    // const session = first_cell.find('.row-year').text() + SESSION_ABBREVS[first_cell.find('.row-sem').text()];
                    // for (let i in PLAN.sessions) {
                    //     let course_slot = degree_plan[session][i];
                    //     let cell = $(event.target.children[parseInt(i) + 1]);
                    //     course_slot['code'] = cell.find('.course-code').text();
                    //     course_slot['title'] = cell.find('.course-title').text();
                    // }
                }
            });
            grid.append(row);
        }
    }
    batchCourseTitles(titles_fill_nodes);
    $.when.apply($, async_operations).done(function () {
        updateProgress();
        updateRecommendations();
    });
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
        '    <div class="fa fa-sync-alt fa-spin mx-auto my-auto py-2" style="font-size: 2rem;"></div>\n' +
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
    });
    $(this).on('shown.bs.popover', function () {
        let popover = $(this).data('bs.popover');
        if (popover['data-received'] || false) {
            const recommendations = $(popover.tip).find('.result-course');
            recommendations.each(coursePopoverSetup);
            for (const entry of recommendations) {
                const code = $(entry).find('.course-code').text();
                const year = $(entry).find('.course-year').text();
                makeCourseDraggable($(entry), code, year);
            };
        }
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
        '    <div class="fa fa-sync-alt fa-spin mx-auto my-auto py-2" style="font-size: 2rem;"></div>\n' +
        '</div>',
        template: '<div class="popover mms-popover" role="tooltip" data-code="' + code + '">\n' +
        '    <div class="arrow"></div>\n' +
        '    <div class="h3 popover-header"></div>\n' +
        '    <div class="mms-add"><button class="btn btn-info btn-sm btn-mms-add">Add to Plan</button></div>\n' +
        '    <div class="popover-body"></div>\n' +
        '    <a href="https://programsandcourses.anu.edu.au/' + MMS_TYPE_PRINT[code.split('-')[1]].toLowerCase() + '/' + code +
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
            const code = r.code;
            const year = THIS_YEAR; // TODO: Fix for course years. Need the most recent year with data available.
            const title = r.title;
            let item = $(
                '<div class="draggable-course result-course list-group-item list-group-item-action">\n    ' +
                '<span class="course-code">' + code + '</span>\n    ' +
                '<span class="course-title">' + title + '</span>\n' +
                '</div>');
            makeCourseDraggable(item, code, year);
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

function updateMMSSearchResults(data, type) {
    const section = $({
        'major': '#results-majors', 'minor': '#results-minors', 'specialisation': '#results-specs'
    }[type]);
    let body = section.find('.card-body');
    body.find('.result-mms').popover('dispose');
    body.empty();
    const responses = data.responses;
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
    searchResultsLoading(false, false);
    section.collapse('show');
    console.log(type + ' search successful')
}

function updateWarningNotices() {
    let notice = $('#courses-forced-notice');
    let list = $('#courses-forced-list');
    if (PLAN.warnings.length > 0) notice.css({'display': 'block'});
    else notice.css({'display': ''});
    list.empty();
    let count = 0;
    for (let warning of PLAN.warnings) {
        if (count !== 0) list.append(', ');
        if (warning.type === "CourseForceAdded") {
            let link = $('<a class="course-highlighter" href="javascript:void(0)">' + warning.text + '</a>');
            link.click(function () {
                warning.runActions();
            });
            list.append(link);
        }
        count++;
    }
}

function makeSlotDroppable(item) {
    item.droppable({
        accept: '.draggable-course',
        drop: dropOnSlot,
        over: function (event, ui) {
            item.addClass('active-drop');
        },
        out: function (event, ui) {
            item.removeClass('active-drop');
        }
    });
}

function makeCourseDraggable(item, code, year) {
    item.draggable({
        zIndex: 800,
        revert: true,
        helper: 'clone',
        start: function (event, ui) {
            highlightElectives();
            ui.helper.addClass('dragged-course');
            highlightInvalidSessions(getCourseOffering(code, year));
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

async function highlightInvalidSessions(offering) {
    offering = await offering;
    let invalid_sessions = {};
    let offering_sessions = offering.extras.semester || [1, 2]; // Currently assumes empty = both semesters. TODO: Change for course sessions
    for (const session of PLAN.sessions) {
        const checked = offering.checkRequirements(PLAN, session);
        const offered = offering_sessions.includes(parseInt(session.slice(-1)));
        if (!checked.sat) {
            if (checked.inc.length) invalid_sessions[session] = "Incompatible courses: " + checked.inc;
            else invalid_sessions[session] = "Prerequisites not met"
        }
        if (!offered) invalid_sessions[session] = "Not available in this semester/session"
    }
    for (let row of $('#plan-grid').find('.plan-row')) {
        const first_cell = $(row.children[0]);
        const session = first_cell.find('.row-year').text() + SESSION_ABBREVS[first_cell.find('.row-sem').text()];
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

function setupDegreeRequirements(degree) {
    const required = degree.rules;
    let reqs_list = $('#degree-reqs-list'); // TODO: Fix for FDDs.
    reqs_list.sortable();
    let header = $('#degree-header');
    let unit_count = header.find('.unit-count');
    unit_count.text("0/" + degree.units + " units");
    let titles_fill_nodes = {};
    let async_operations = [];
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
        for (let code of courses) {
            const year = THIS_YEAR; // TODO: Fix for course years. Need the most recent year with data available.
            let title_node = $('<span class="course-title"/>');
            if (code in KNOWN_COURSES && year in KNOWN_COURSES[code]) {
                title_node.text(KNOWN_COURSES[code][year].title)
            }
            else {
                if (!(code in titles_fill_nodes)) titles_fill_nodes[code] = [];
                titles_fill_nodes[code].push(function (title) {
                    title_node.text(title);
                });
            }
            let item = $(
                '<div class="list-group-item list-group-item-action draggable-course result-course">' +
                '    <span class="course-code">' + code + '</span> ' +
                '</div>'
            );
            item.append(title_node);
            item.each(coursePopoverSetup);
            makeCourseDraggable(item, code, year);
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
                description += '<a href="javascript:void(0)" class="level-filter" onclick="addFilter(\'level\',\'' + levels[i] + '\')">' + levels[i] + '</a> ';
            }
        }
        description += 'courses starting with: ';
        for (let i in codes) {
            if (i > 0) description += ', ';
            description += '<a href="javascript:void(0)" class="code-filter" onclick="addFilter(\'code\',\'' + codes[i] + '\')">' + codes[i] + '</a>';
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
            const year = THIS_YEAR; // TODO: Fix for MMS years. Need the most recent year with data available.
            let title_node = $('<span class="mms-name"/>');
            const identifier = code + '/' + year;
            if (!(identifier in mms_to_retrieve)) mms_to_retrieve[identifier] = [];
            mms_to_retrieve[identifier].push(function (mms) {
                title_node.text(mms.title);
                if (title_node.parent().hasClass('result-mms')) title_node.parent().each(mmsPopoverSetup);
            });
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

    for (let type in required) {
        if (!required.hasOwnProperty(type)) continue;
        if (type === "compulsory_courses") {
            let card = createCourseListSection(type, "Compulsory courses", required[type]);
            reqs_list.append(card);
            section_count++;
        }
        if (type === "one_from_here") {
            for (let section of required[type]) {
                let card = createCourseListSection(type, "Pick at least one", section);
                reqs_list.append(card);
                section_count++;
            }
        }
        if (type === "x_from_here") {
            for (let section of required[type]) {
                let title = 'Choose at least ' + section['num'] + ' units' +
                    '<span class="unit-count mr-2">0/' + section['num'] + '</span>\n';
                if (typeof(section['courses']) === "string") {
                    const name = section['courses'];
                    let placeholder = $('<div/>');
                    reqs_list.append(placeholder);
                    const original_section_count = section_count;
                    section_count++;
                    if (name in KNOWN_COURSE_LISTS) {
                        let card = createCourseListSection(type, title, KNOWN_COURSE_LISTS[name], original_section_count);
                        placeholder.replaceWith(card);
                    } else {
                        async_operations.push($.ajax({
                            url: 'search/courselists',
                            data: {'query': name},
                            success: function (data) {
                                let courses = data.response.courses;

                                courses = courses.map(function (value, index, array) {
                                    if (typeof(value) !== "string") return value[0];
                                    else return value;
                                });
                                KNOWN_COURSE_LISTS[name] = courses;
                                if (data.response.type !== name) return;
                                let card = createCourseListSection(type, title, courses, original_section_count);
                                placeholder.replaceWith(card);
                            }
                        }));
                    }
                } else {
                    let card = createCourseListSection(type, title, section['courses']);
                    reqs_list.append(card);
                    section_count++;
                }
            }
        }
        if (type === "x_from_category") {
            for (let section of required[type]) {
                let title = 'Choose at least ' + section['num'] + ' units' +
                    '<span class="unit-count mr-2">0/' + section['num'] + '</span>\n';
                let card = createCourseCategorySection(type, title, section['code'], section.level);
                reqs_list.append(card);
                section_count++;
            }
        }
        if (type === "required_m/m/s") {
            for (let code of required[type]) {
                const year = THIS_YEAR; // TODO: Fix for MMS years. Need the most recent year with data available.
                let mms_type = code.split('-').pop();
                let card = $('<div class="deg deg-plain-text">\n' +
                    '    <span class="mms-code">' + code + '</span>\n' +
                    '    <strong>Compulsory ' + MMS_TYPE_PRINT[mms_type] + ':</strong>\n' +
                    '    <div id="deg-section' + section_count + '"></div>' +
                    '    <span class="unit-count mr-1">0/' + MMS_TYPE_UNITS[mms_type] + '</span>' +
                    '</div>');
                let title_node = $('<span/>');
                const identifier = code + '/' + year;
                if (!(identifier in mms_to_retrieve)) mms_to_retrieve[identifier] = [];
                mms_to_retrieve[identifier].push(function (mms) {
                    title_node.text(mms.title);
                    if (title_node.parent().hasClass('result-mms')) title_node.parent().each(mmsPopoverSetup);
                    if (mms_to_display.includes(code)) async_operations.push(mms_add(code, year));
                    // Make this M/M/S undeletable.
                    $('#mms-active-list').find('.mms-code').each(function () {
                        if ($(this).text() === code) {  // TODO: Fix for MMS years. Should this be undeletable?
                            // This is also making any other years of this MMS undeletable.
                            $(this).parent().find('.mms-delete').remove();
                        }
                    });
                });
                mms_to_display.push(code);
                card.append(title_node);
                reqs_list.append(card);
                section_count++;
            }
        }
        if (type === "one_from_m/m/s") {
            for (let section of required[type]) {
                let card = createMMSListSection(type, "Complete one of these majors, minors, or specialisations", section);
                reqs_list.append(card);
                section_count++;
            }
        }
        if (type === "max_by_level") {
            for (let level in required[type]) {
                let limit = required[type][level];
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
    $.when.apply($, async_operations).then(function () {
        batchCourseTitles(titles_fill_nodes);
        batchMMSData(mms_to_retrieve);
        updateProgress();
    })
}

function updateMMSTrackers() {
    for (const mms of PLAN.trackedMMS) {
        const mms_card = $('#mms-active-list').find('#mms-active-' + mms.identifier).parent();
        const results = mms.checkRequirements(PLAN);
        for (const i in results.rule_details) {
            const details = results.rule_details[i];
            const type = mms.rules[i].type;
            const card = mms_card.find('#mms-active-' + mms.identifier + '-select' + i).parent();
            for (const c of card.find('.result-course')) {
                const code = $(c).find('.course-code').text();
                setChecked($(c), details.codes.includes(code), type === 'fixed');
            }
            updateUnitCount(card.find('.unit-count'), details.units);
            setPanelStatus(card, details.sat ? 'done' : 'incomplete');
        }
        updateUnitCount($(mms_card[0].firstElementChild).find('.unit-count'), results.units);
        setPanelStatus(mms_card, results.sat ? 'done' : 'incomplete');
    }
}


async function updateDegreeTrackers() {
    const reqList = $('#degree-reqs-list');
    for (const deg of PLAN.degrees) { // TODO: Fix for FDDs
        const results = deg.checkRequirements(PLAN);
        const required = deg.rules;
        for (const i in results.rule_details) { // TODO: Fix for Optional Sections
            const details = results.rule_details[i];
            const type = details.type;
            const card = reqList.find('#deg-section' + i).parent();
            let section_status = "";
            if (["compulsory_courses", "one_from_here", "x_from_here"].includes(type)) {
                for (const c of card.find('.result-course')) {
                    const code = $(c).find('.course-code').text();
                    setChecked($(c), details.codes.includes(code), type === 'compulsory_courses');
                }
                section_status = details.sat ? 'done' : 'incomplete';
            } else if (["x_from_category", "max_by_level"].includes(type)) {
                const group = card.find('.list-group');
                for (const code of details.codes) {
                    const year = THIS_YEAR; // TODO: Fix for course years. Need the most recent year with data available.
                    const offering = await getCourseOffering(code, year);
                    const item = $(
                        '<div class="list-group-item list-group-item-action result-course inc">' +
                        '    <span class="course-code">' + code + '</span> ' +
                        '    <span class="course-year">' + year + '</span> ' +
                        '    <span class="course-title">' + offering.title + '</span>' +
                        '</div>'
                    );
                    item.each(coursePopoverSetup);
                    group.append(item);
                }
                section_status = details.sat ? 'done' : (type === "max_by_level" ? 'problem' : 'incomplete');
            } else if (["required_m/m/s", "one_from_m/m/s"].includes(type)) {
                for (const entry of card.find('.mms-code')) {
                    const code = $(entry).text();
                    if (details.completed.includes(code)) {
                        $(entry).parent().addClass('inc').removeClass('partial');
                    } else if (details.codes.includes(code)) {
                        $(entry).parent().addClass('partial').removeClass('inc')
                    } else $(entry).parent().removeClass('inc partial');
                }
                if (details.sat) section_status = 'done';
                else if (details.codes.length) section_status = 'incomplete';
                else section_status = 'problem'
            }
            if (details.units !== undefined) updateUnitCount(card.find('.unit-count'), details.units);
            setPanelStatus(card, section_status);
        }
        updateUnitCount($('#degree-header').find('.unit-count'), results.units);
        $('#degree-completed-notice').css({'display': results.sat ? 'block' : ''});
    }
}

function updateUnitCount(counter, value) {
    counter.text(value + '/' + counter.text().split(/[\/ ]/)[1]); // Regex that selects either forward slash or space.
}

function setChecked(node, checked, useCrosses) {
    if (checked) {
        node.addClass('inc');
        if (useCrosses) node.removeClass('exc');
    } else {
        node.removeClass('inc');
        if (useCrosses) node.addClass('exc');
    }
}

function setPanelStatus(panel, status) {
    if (status === 'done') {                // Done
        panel.addClass('alert-success');
        panel.removeClass('alert-warning alert-danger');
    } else if (status === 'incomplete') {   // Incomplete
        panel.addClass('alert-warning');
        panel.removeClass('alert-success alert-danger');
    } else if (status === 'problem') {      // Problem
        panel.addClass('alert-danger');
        panel.removeClass('alert-success alert-warning');
    } else panel.removeClass('alert-success alert-warning alert-danger');
}

function updateProgress() {
    updateMMSTrackers();
    updateDegreeTrackers();
}

async function updateRecommendations() {
    let group = $('#degree-recommendations-list');
    let res = {};
    await $.ajax({
        url: 'recommendations/recommend',
        data: {
            'code': degree_code,
            'courses': JSON.stringify(preparePlanForUpload(PLAN))
        },
        success: function (data) {
            res = data;
        }
    });
    let titles_fill_nodes = {};
    group.find('.result-course').popover('dispose');
    group.empty();
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
        makeCourseDraggable(item, code, year);
        item.each(coursePopoverSetup);
        group.append(item);
    }
    await batchCourseTitles(titles_fill_nodes);
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
        courseResultsList.find('.fa-sync-alt').css({'display': rDisplay[show]});
    } else {
        mmsResultsList.find('.collapse').css({'display': cDisplay[show]});
        mmsResultsList.find('.fa-sync-alt').css({'display': rDisplay[show]});
    }
}